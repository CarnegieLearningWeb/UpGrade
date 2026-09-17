import { performance } from 'perf_hooks';
import { Inject, Service } from 'typedi';
import { DataSource, EntityManager } from 'typeorm';
import { ForbiddenError, UnauthorizedError } from 'routing-controllers';
import {
  BatchDeleteEntity,
  BatchDeleteItemResult,
  BatchDeleteResult,
  DeletionReasonCode,
  hasBatchDeletePermission,
} from 'upgrade_types';
import { env } from '../../env';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { InjectDataSource, InjectRepository } from '../../typeorm-typedi-extensions';
import { DeletionTransaction } from '../../types/DeletionTransaction';
import { UserDTO } from '../DTO/UserDTO';
import { MoocletError } from '../errors/MoocletError';
import { ExperimentService } from './ExperimentService';
import { FeatureFlagService } from './FeatureFlagService';
import { MoocletExperimentService } from './MoocletExperimentService';
import { SegmentService } from './SegmentService';
import { DeletionRepository } from '../repositories/DeletionRepository';

// Admission budget: never abandon an in-flight deletion or claim it has been cancelled.
// Check before starting another item and again after acquiring its target lock.
export const BATCH_DELETE_START_BUDGET_MS = 60_000;

class BatchDeleteSkippedError extends Error {
  constructor(public readonly result: BatchDeleteItemResult) {
    super(result.reasonCode);
  }
}

@Service()
export class BatchDeleteService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Inject(() => ExperimentService) private experiments: ExperimentService,
    @Inject(() => FeatureFlagService) private flags: FeatureFlagService,
    @Inject(() => SegmentService) private segments: SegmentService,
    @Inject(() => MoocletExperimentService) private mooclets: MoocletExperimentService,
    @InjectRepository() private deletionRepository: DeletionRepository
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
      const result = await this.deleteOne(entity, id, user, logger, deadline);
      results.push(result);
      if (result.outcome !== 'not_found' && result.outcome !== 'not_attempted') phase = 'executed';
      // An already absent target does not prevent independent items from being deleted.
      if (result.outcome === 'not_found') continue;
      // A committed item with a post-delete failure must not be retried, but still stops this batch.
      if (result.outcome !== 'deleted' || result.reasonCode) {
        results.push(
          ...ids.slice(results.length).map(
            (remaining): BatchDeleteItemResult => ({
              id: remaining,
              outcome: 'not_attempted',
              ...(result.reasonCode === DeletionReasonCode.BATCH_BUDGET_EXCEEDED
                ? { reasonCode: DeletionReasonCode.BATCH_BUDGET_EXCEEDED }
                : {}),
            })
          )
        );
        break;
      }
    }
    return { phase, results };
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
        await this.deletionRepository.setLockTimeout(runner.manager);
        const target = await this.deletionRepository.findForDeletion(entity, id, runner.manager);
        if (!target) {
          throw new BatchDeleteSkippedError({ id, outcome: 'not_found', reasonCode: DeletionReasonCode.NOT_FOUND });
        }
        if (performance.now() >= deadline) {
          throw new BatchDeleteSkippedError({
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
          throw new Error('Deletion did not return the requested target');
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
          // Preserve an execution failure, but do not let a normal skip hide a release failure.
          if (!transactionError || transactionError instanceof BatchDeleteSkippedError) transactionError = releaseError;
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
        await this.segments.deleteSegment(id, logger, executeTransaction, true);
      }
      return committed
        ? { id, outcome: 'deleted' }
        : { id, outcome: 'unknown', reasonCode: DeletionReasonCode.OUTCOME_UNKNOWN };
    } catch (error) {
      if (error instanceof BatchDeleteSkippedError && rolledBack) return error.result;
      logger.error({ message: 'Batch deletion item failed', entity, id, committed, error });
      if (committed) return { id, outcome: 'deleted', reasonCode: DeletionReasonCode.POST_DELETE_FAILED };
      // A failed COMMIT can mean the server committed but its acknowledgment was lost.
      if (commitAttempted || (mutationStarted && !rolledBack)) {
        return { id, outcome: 'unknown', reasonCode: DeletionReasonCode.OUTCOME_UNKNOWN };
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
