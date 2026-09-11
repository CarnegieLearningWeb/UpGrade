import { Service } from 'typedi';
import { DataSource, EntityManager } from 'typeorm';
import { HttpError } from 'routing-controllers';
import {
  BatchDeleteEntity,
  BatchDeleteItemResult,
  DeletionReasonCode,
  getExperimentDeletionReason,
  getFlagDeletionReason,
} from 'upgrade_types';
import { InjectDataSource } from '../../typeorm-typedi-extensions';
import { DeletionTransaction } from '../../types/DeletionTransaction';
import { Experiment } from '../models/Experiment';
import { FeatureFlag } from '../models/FeatureFlag';
import { assertSegmentDeletionAllowed, SegmentDeletionBlockedError } from './batch/SegmentDeletionGuard';

export class DeletionBlockedError extends Error {
  constructor(public readonly result: BatchDeleteItemResult) {
    super(result.reasonCode);
  }
}

/** Check state under the same locks/transaction as deletion; permissions remain the caller's responsibility. */
export async function assertDeletionStateAllowed(
  entity: BatchDeleteEntity,
  id: string,
  manager: EntityManager
): Promise<void> {
  if (entity === 'segments') {
    try {
      await assertSegmentDeletionAllowed(id, manager);
    } catch (error) {
      if (!(error instanceof SegmentDeletionBlockedError)) throw error;
      throw new DeletionBlockedError({
        id,
        outcome: error.reason === 'missing' ? 'not_found' : 'ineligible',
        reasonCode:
          error.reason === 'missing'
            ? DeletionReasonCode.NOT_FOUND
            : error.reason === 'protected'
            ? DeletionReasonCode.PROTECTED_SEGMENT_TYPE
            : DeletionReasonCode.SEGMENT_IN_USE,
      });
    }
    return;
  }

  await manager.query(`SELECT set_config('lock_timeout', CASE
    WHEN current_setting('lock_timeout')::interval = interval '0'
      OR current_setting('lock_timeout')::interval > interval '5 seconds'
    THEN '5s' ELSE current_setting('lock_timeout') END, true)`);
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

const rejectionMessages: Partial<Record<DeletionReasonCode, string>> = {
  [DeletionReasonCode.NOT_FOUND]: 'The item no longer exists.',
  [DeletionReasonCode.EXPERIMENT_STATE_UNSUPPORTED]: 'The experiment cannot be deleted in its current state.',
  [DeletionReasonCode.FEATURE_FLAG_ENABLED]: 'Disable the feature flag before deleting it.',
  [DeletionReasonCode.FEATURE_FLAG_STATUS_UNSUPPORTED]: 'The feature flag cannot be deleted in its current state.',
  [DeletionReasonCode.SEGMENT_IN_USE]: 'The segment is in use and cannot be deleted.',
  [DeletionReasonCode.PROTECTED_SEGMENT_TYPE]: 'Only ordinary public segments can be deleted through this endpoint.',
};

/** Opt in at the three single-item API boundaries, not in services also used for internal list cleanup. */
@Service()
export class DeletionStateService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  transactionFor(entity: BatchDeleteEntity, id: string): DeletionTransaction {
    return async (work) => {
      try {
        return await this.dataSource.transaction('READ COMMITTED', async (manager) => {
          await assertDeletionStateAllowed(entity, id, manager);
          return work(manager);
        });
      } catch (error) {
        if (!(error instanceof DeletionBlockedError)) throw error;
        // A state rejection is not a duplicate-key conflict (the existing middleware reserves 409 for that).
        throw new HttpError(
          error.result.outcome === 'not_found' ? 404 : 400,
          rejectionMessages[error.result.reasonCode] || 'The item cannot be deleted in its current state.'
        );
      }
    };
  }
}
