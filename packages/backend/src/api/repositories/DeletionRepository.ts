import { EntityManager, Repository } from 'typeorm';
import { EXPERIMENT_STATE, STANDARD_LIST_TYPE } from 'upgrade_types';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { Experiment } from '../models/Experiment';
import { FeatureFlag } from '../models/FeatureFlag';
import { Segment } from '../models/Segment';
import repositoryError from './utils/repositoryError';

/** All reads and locks use the caller's deletion transaction, never the repository's default manager. */
@EntityRepository()
export class DeletionRepository extends Repository<DeletionRepository> {
  public async getTransactionIsolation(manager: EntityManager): Promise<string> {
    const [{ transaction_isolation }] = await manager.query('SHOW transaction_isolation').catch((errorMsg: any) => {
      throw repositoryError('DeletionRepository', 'getTransactionIsolation', {}, errorMsg);
    });
    return transaction_isolation;
  }

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

  public async findDeletionState(
    entity: 'experiments' | 'flags',
    id: string,
    manager: EntityManager
  ): Promise<Pick<Experiment, 'id' | 'state'> | Pick<FeatureFlag, 'id' | 'status'>> {
    const query =
      entity === 'experiments'
        ? manager
            .getRepository(Experiment)
            .findOne({ where: { id }, select: { id: true, state: true }, lock: { mode: 'pessimistic_write' } })
        : manager
            .getRepository(FeatureFlag)
            .findOne({ where: { id }, select: { id: true, status: true }, lock: { mode: 'pessimistic_write' } });
    return query.catch((errorMsg: any) => {
      throw repositoryError('DeletionRepository', 'findDeletionState', { entity, id }, errorMsg);
    });
  }

  public async findSegmentForDeletion(id: string, manager: EntityManager): Promise<Pick<Segment, 'id' | 'type'>> {
    // FOR UPDATE conflicts with the KEY SHARE locks taken by new foreign-key references.
    const [target] = await manager
      .query('SELECT id, type FROM segment WHERE id = $1 FOR UPDATE', [id])
      .catch((errorMsg: any) => {
        throw repositoryError('DeletionRepository', 'findSegmentForDeletion', { id }, errorMsg);
      });
    return target;
  }

  /** Call after locking the target with findSegmentForDeletion, in the same READ COMMITTED transaction. */
  public async lockReferencesAndCheckSegmentUsage(id: string, manager: EntityManager): Promise<boolean> {
    try {
      const locked = new Set<string>([id]);
      let ancestors: string[];
      let unlocked: string[];
      do {
        const rows: { id: string }[] = await manager.query(
          `WITH RECURSIVE ancestors(id) AS (
             SELECT $1::uuid
             UNION
             SELECT link."parentSegmentId"
             FROM segment_for_segment link
             JOIN ancestors ON link."childSegmentId" = ancestors.id
           )
           SELECT id FROM ancestors ORDER BY id`,
          [id]
        );
        ancestors = rows.map((row) => row.id);
        unlocked = ancestors.filter((ancestor) => !locked.has(ancestor));
        if (unlocked.length) {
          const acquired: { id: string }[] = await manager.query(
            'SELECT id FROM segment WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE',
            [unlocked]
          );
          acquired.forEach((row) => locked.add(row.id));
        }
        // A writer may have committed while a lock was being acquired. Discover again with a fresh snapshot.
      } while (unlocked.length);

      // Archived owners must also be locked: reactivation can make an otherwise unused segment Used.
      // KEY SHARE would not stop a state-only UPDATE; SHARE does.
      await manager.query(
        `SELECT experiment.id FROM experiment WHERE experiment.id IN (
           SELECT "experimentId" FROM experiment_segment_inclusion WHERE "segmentId" = ANY($1::uuid[])
           UNION
           SELECT "experimentId" FROM experiment_segment_exclusion WHERE "segmentId" = ANY($1::uuid[])
         ) ORDER BY experiment.id FOR SHARE`,
        [ancestors]
      );

      const [{ used }] = await manager.query(
        `SELECT
           EXISTS (
             SELECT 1 FROM experiment_segment_inclusion ref JOIN experiment ON experiment.id = ref."experimentId"
             WHERE ref."segmentId" = ANY($2::uuid[]) AND experiment.state <> $3
           ) OR EXISTS (
             SELECT 1 FROM experiment_segment_exclusion ref JOIN experiment ON experiment.id = ref."experimentId"
             WHERE ref."segmentId" = ANY($2::uuid[]) AND experiment.state <> $3
           ) OR EXISTS (
             SELECT 1 FROM feature_flag_segment_inclusion WHERE "segmentId" = ANY($2::uuid[])
           ) OR EXISTS (
             SELECT 1 FROM feature_flag_segment_exclusion WHERE "segmentId" = ANY($2::uuid[])
           ) OR EXISTS (
             SELECT 1 FROM segment_for_segment child
             JOIN segment list ON list.id = child."parentSegmentId"
             WHERE child."childSegmentId" = $1 AND list."listType" = $4
               AND EXISTS (SELECT 1 FROM segment_for_segment parent WHERE parent."childSegmentId" = list.id)
           ) AS used`,
        [id, ancestors, EXPERIMENT_STATE.ARCHIVED, STANDARD_LIST_TYPE.SEGMENT]
      );
      return used;
    } catch (errorMsg) {
      throw repositoryError('DeletionRepository', 'lockReferencesAndCheckSegmentUsage', { id }, errorMsg);
    }
  }
}
