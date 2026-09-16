import { EntityManager, Repository } from 'typeorm';
import { BatchDeleteEntity } from 'upgrade_types';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { Experiment } from '../models/Experiment';
import { FeatureFlag } from '../models/FeatureFlag';
import { Segment } from '../models/Segment';
import repositoryError from './utils/repositoryError';

/** All reads and locks use the caller's deletion transaction, never the repository's default manager. */
@EntityRepository()
export class DeletionRepository extends Repository<DeletionRepository> {
  public async setLockTimeout(manager: EntityManager): Promise<void> {
    // Cap each lock wait through cleanup/deletion; preserve any tighter caller/database limit.
    // Transaction-local settings expire on commit/rollback. This is not a total request deadline.
    await manager
      .query(
        `SELECT set_config('lock_timeout', CASE
        WHEN current_setting('lock_timeout')::interval = interval '0'
          OR current_setting('lock_timeout')::interval > interval '5 seconds'
        THEN '5s' ELSE current_setting('lock_timeout') END, true)`
      )
      .catch((errorMsg: any) => {
        throw repositoryError('DeletionRepository', 'setLockTimeout', {}, errorMsg);
      });
  }

  public async findForDeletion(
    entity: BatchDeleteEntity,
    id: string,
    manager: EntityManager
  ): Promise<{ id: string } | null> {
    const target = { experiments: Experiment, flags: FeatureFlag, segments: Segment }[entity];
    return manager
      .getRepository<{ id: string }>(target)
      .findOne({ where: { id }, select: { id: true }, lock: { mode: 'pessimistic_write' } })
      .catch((errorMsg: any) => {
        throw repositoryError('DeletionRepository', 'findForDeletion', { entity, id }, errorMsg);
      });
  }
}
