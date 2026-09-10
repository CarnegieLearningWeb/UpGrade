import { performance } from 'perf_hooks';
import { Inject, Service } from 'typedi';
import { DataSource, EntityManager } from 'typeorm';
import { ForbiddenError, UnauthorizedError } from 'routing-controllers';
import {
  BatchDeleteEntity,
  BatchDeleteItemResult,
  BatchDeleteResult,
  DeletionEligibilityItem,
  DeletionEligibilityResult,
  DeletionReasonCode,
  getExperimentDeletionReason,
  getFlagDeletionReason,
  hasBatchDeletePermission,
} from 'upgrade_types';
import { env } from '../../../env';
import { UpgradeLogger } from '../../../lib/logger/UpgradeLogger';
import { InjectDataSource } from '../../../typeorm-typedi-extensions';
import { DeletionTransaction } from '../../../types/DeletionTransaction';
import { UserDTO } from '../../DTO/UserDTO';
import { MoocletError } from '../../errors/MoocletError';
import { Experiment } from '../../models/Experiment';
import { FeatureFlag } from '../../models/FeatureFlag';
import { ExperimentService } from '../ExperimentService';
import { FeatureFlagService } from '../FeatureFlagService';
import { MoocletExperimentService } from '../MoocletExperimentService';
import { SegmentService } from '../SegmentService';
import { DeletionEligibilityService } from './DeletionEligibilityService';
import { assertSegmentDeletionAllowed, SegmentDeletionBlockedError } from './SegmentDeletionGuard';

// Admission budget: never abandon an in-flight deletion or claim it has been cancelled.
// Check before starting another item and again after acquiring its eligibility locks.
export const BATCH_DELETE_START_BUDGET_MS = 60_000;

class DeletionBlockedError extends Error {
  constructor(public readonly result: BatchDeleteItemResult) {
    super(result.reasonCode);
  }
}

@Service()
export class BatchDeleteService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Inject(() => DeletionEligibilityService) private eligibility: DeletionEligibilityService,
    @Inject(() => ExperimentService) private experiments: ExperimentService,
    @Inject(() => FeatureFlagService) private flags: FeatureFlagService,
    @Inject(() => SegmentService) private segments: SegmentService,
    @Inject(() => MoocletExperimentService) private mooclets: MoocletExperimentService
  ) {}

  public async delete(
    entity: BatchDeleteEntity,
    ids: string[],
    user: UserDTO,
    logger: UpgradeLogger
  ): Promise<BatchDeleteResult> {
    if (!user) throw new UnauthorizedError('A current user is required');
    if (!hasBatchDeletePermission(user.role, entity)) throw new ForbiddenError('Deletion permission is required');
    const deadline = performance.now() + BATCH_DELETE_START_BUDGET_MS;
    let preflight: DeletionEligibilityResult;
    try {
      preflight = await this.eligibility[entity](ids, user);
    } catch (error) {
      logger.error({ message: 'Batch deletion preflight failed', entity, error });
      return {
        phase: 'rejected',
        results: ids.map((id) => ({
          id,
          outcome: 'not_attempted',
          reasonCode: DeletionReasonCode.ELIGIBILITY_UNAVAILABLE,
        })),
      };
    }
    if (!preflight.allDeletable) {
      return { phase: 'rejected', results: preflight.items.map((item) => this.preflightResult(item)) };
    }

    const results: BatchDeleteItemResult[] = [];
    let phase: BatchDeleteResult['phase'] = 'rejected';
    for (const id of ids) {
      if (performance.now() >= deadline) {
        results.push(
          ...ids.slice(results.length).map(
            (remaining): BatchDeleteItemResult => ({
              id: remaining,
              outcome: 'not_attempted',
              reasonCode: DeletionReasonCode.BATCH_BUDGET_EXCEEDED,
            })
          )
        );
        break;
      }
      phase = 'executed';
      const result = await this.deleteOne(entity, id, user, logger, deadline);
      results.push(result);
      // A committed item with a post-delete failure must not be retried, but still stops this batch.
      if (result.outcome !== 'deleted' || result.reasonCode) {
        results.push(
          ...ids.slice(results.length).map(
            (remaining): BatchDeleteItemResult => ({
              id: remaining,
              outcome: 'not_attempted',
            })
          )
        );
        break;
      }
    }
    return { phase, results };
  }

  private preflightResult(item: DeletionEligibilityItem): BatchDeleteItemResult {
    if (item.canDelete) return { id: item.id, outcome: 'not_attempted' };
    const outcome =
      item.availability === 'not_found'
        ? 'not_found'
        : item.reasonCode === DeletionReasonCode.MISSING_PERMISSION
        ? 'forbidden'
        : 'ineligible';
    return { id: item.id, outcome, reasonCode: item.reasonCode || DeletionReasonCode.ELIGIBILITY_UNAVAILABLE };
  }

  private async guard(entity: BatchDeleteEntity, id: string, manager: EntityManager): Promise<void> {
    if (entity === 'segments') return; // The existing segment hook runs inside this same transaction.
    const row =
      entity === 'experiments'
        ? await manager
            .getRepository(Experiment)
            .findOne({ where: { id }, select: { id: true, state: true }, lock: { mode: 'pessimistic_write' } })
        : await manager
            .getRepository(FeatureFlag)
            .findOne({ where: { id }, select: { id: true, status: true }, lock: { mode: 'pessimistic_write' } });
    if (!row) throw new DeletionBlockedError({ id, outcome: 'not_found', reasonCode: DeletionReasonCode.NOT_FOUND });
    const reason =
      entity === 'experiments'
        ? getExperimentDeletionReason((row as Experiment).state)
        : getFlagDeletionReason((row as FeatureFlag).status);
    if (reason) throw new DeletionBlockedError({ id, outcome: 'ineligible', reasonCode: reason });
  }

  private async deleteOne(
    entity: BatchDeleteEntity,
    id: string,
    user: UserDTO,
    logger: UpgradeLogger,
    deadline: number
  ): Promise<BatchDeleteItemResult> {
    let committed = false;
    let rolledBack = false;
    let commitAttempted = false;
    let mutationStarted = false;
    const executeTransaction: DeletionTransaction = async <T>(work: (manager: EntityManager) => Promise<T>) => {
      const runner = this.dataSource.createQueryRunner();
      let transactionError: unknown;
      let response: T;
      try {
        await runner.connect();
        await runner.startTransaction('READ COMMITTED');
        await runner.manager.query(`SELECT set_config('lock_timeout', CASE
          WHEN current_setting('lock_timeout')::interval = interval '0'
            OR current_setting('lock_timeout')::interval > interval '5 seconds'
          THEN '5s' ELSE current_setting('lock_timeout') END, true)`);
        await this.guard(entity, id, runner.manager);
        if (performance.now() >= deadline) {
          throw new DeletionBlockedError({
            id,
            outcome: 'not_attempted',
            reasonCode: DeletionReasonCode.BATCH_BUDGET_EXCEEDED,
          });
        }
        mutationStarted = true;
        response = await work(runner.manager);
        // Legacy experiment/flag repositories return arrays despite their declared return types.
        const deleted = Array.isArray(response) ? response[0] : response;
        if (!deleted || (deleted as { id?: string }).id?.toLowerCase() !== id.toLowerCase()) {
          throw new Error('Deletion did not return the guarded target');
        }
        commitAttempted = true;
        await runner.commitTransaction();
        committed = true;
      } catch (error) {
        transactionError = error;
        if (runner.isTransactionActive) {
          try {
            await runner.rollbackTransaction();
            rolledBack = true;
          } catch (rollbackError) {
            logger.error({ message: 'Batch deletion rollback could not be confirmed', id, rollbackError });
          }
        }
      } finally {
        try {
          await runner.release();
        } catch (releaseError) {
          logger.error({ message: 'Batch deletion connection release failed', id, releaseError });
          // Preserve the transaction failure if connection cleanup also fails.
          if (!transactionError) transactionError = releaseError;
        }
      }
      if (transactionError) throw transactionError;
      return response;
    };
    try {
      if (entity === 'experiments') {
        const ref = env.mooclets.enabled
          ? await this.mooclets.getMoocletExperimentRefByUpgradeExperimentId(id)
          : undefined;
        if (ref)
          await this.mooclets.syncDelete(
            { moocletExperimentRef: ref, experimentId: id, currentUser: user, logger },
            executeTransaction
          );
        else await this.experiments.delete(id, user, { logger, executeTransaction });
      } else if (entity === 'flags') {
        await this.flags.delete(id, user, logger, executeTransaction);
      } else {
        await this.segments.deleteSegment(
          id,
          logger,
          async (manager) => {
            await assertSegmentDeletionAllowed(id, manager);
            if (performance.now() >= deadline) {
              throw new DeletionBlockedError({
                id,
                outcome: 'not_attempted',
                reasonCode: DeletionReasonCode.BATCH_BUDGET_EXCEEDED,
              });
            }
          },
          executeTransaction
        );
      }
      return committed
        ? { id, outcome: 'deleted' }
        : { id, outcome: 'unknown', reasonCode: DeletionReasonCode.OUTCOME_UNKNOWN };
    } catch (error) {
      logger.error({ message: 'Batch deletion item failed', entity, id, committed, error });
      if (committed) return { id, outcome: 'deleted', reasonCode: DeletionReasonCode.POST_DELETE_FAILED };
      // A failed COMMIT can mean the server committed but its acknowledgment was lost.
      if (commitAttempted || (mutationStarted && !rolledBack)) {
        return { id, outcome: 'unknown', reasonCode: DeletionReasonCode.OUTCOME_UNKNOWN };
      }
      if (error instanceof DeletionBlockedError) return error.result;
      if (error instanceof SegmentDeletionBlockedError) {
        return {
          id,
          outcome: error.reason === 'missing' ? 'not_found' : 'ineligible',
          reasonCode:
            error.reason === 'missing'
              ? DeletionReasonCode.NOT_FOUND
              : error.reason === 'protected'
              ? DeletionReasonCode.PROTECTED_SEGMENT_TYPE
              : DeletionReasonCode.SEGMENT_IN_USE,
        };
      }
      return {
        id,
        outcome: 'failed',
        reasonCode:
          error instanceof MoocletError
            ? DeletionReasonCode.EXTERNAL_SYNC_FAILED
            : (error as { code?: string })?.code === '55P03'
            ? DeletionReasonCode.LOCK_TIMEOUT
            : DeletionReasonCode.DELETE_FAILED,
      };
    }
  }
}
