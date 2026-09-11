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
  hasBatchDeletePermission,
} from 'upgrade_types';
import { env } from '../../../env';
import { UpgradeLogger } from '../../../lib/logger/UpgradeLogger';
import { InjectDataSource } from '../../../typeorm-typedi-extensions';
import { DeletionTransaction } from '../../../types/DeletionTransaction';
import { UserDTO } from '../../DTO/UserDTO';
import { MoocletError } from '../../errors/MoocletError';
import { ExperimentService } from '../ExperimentService';
import { FeatureFlagService } from '../FeatureFlagService';
import { MoocletExperimentService } from '../MoocletExperimentService';
import { SegmentService } from '../SegmentService';
import { DeletionEligibilityService } from './DeletionEligibilityService';
import { assertDeletionStateAllowed, DeletionBlockedError } from '../DeletionStateService';

// Admission budget: never abandon an in-flight deletion or claim it has been cancelled.
// Check before starting another item and again after acquiring its eligibility locks.
export const BATCH_DELETE_START_BUDGET_MS = 60_000;

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
    const eligibilityById = new Map(preflight.items.map((item) => [item.id, item]));
    const results: BatchDeleteItemResult[] = [];
    let phase: BatchDeleteResult['phase'] = 'rejected';
    for (const id of ids) {
      const eligibility = eligibilityById.get(id);
      if (!eligibility.canDelete) {
        results.push(this.preflightResult(eligibility));
        continue;
      }
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
      // A changed state or an already absent target does not prevent independent items from being deleted.
      if (result.outcome === 'ineligible' || result.outcome === 'not_found') continue;
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
    const outcome =
      item.availability === 'not_found'
        ? 'not_found'
        : item.reasonCode === DeletionReasonCode.MISSING_PERMISSION
        ? 'forbidden'
        : 'ineligible';
    return { id: item.id, outcome, reasonCode: item.reasonCode || DeletionReasonCode.ELIGIBILITY_UNAVAILABLE };
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
        // Segments use the existing beforeDelete hook inside this transaction.
        if (entity !== 'segments') await assertDeletionStateAllowed(entity, id, runner.manager);
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
            await assertDeletionStateAllowed(entity, id, manager);
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
      if (error instanceof DeletionBlockedError && rolledBack) return error.result;
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
