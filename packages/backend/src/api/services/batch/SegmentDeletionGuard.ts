import { EntityManager } from 'typeorm';
import { EXPERIMENT_STATE, SEGMENT_TYPE, STANDARD_LIST_TYPE } from 'upgrade_types';

export class SegmentDeletionBlockedError extends Error {
  constructor(public readonly segmentId: string, public readonly reason: 'missing' | 'protected' | 'used') {
    super(`Segment ${segmentId} cannot be deleted: ${reason}`);
    this.name = 'SegmentDeletionBlockedError';
  }
}

const ancestorQuery = `
  WITH RECURSIVE ancestors(id) AS (
    SELECT $1::uuid
    UNION
    SELECT link."parentSegmentId"
    FROM segment_for_segment link
    JOIN ancestors ON link."childSegmentId" = ancestors.id
  )
  SELECT id FROM ancestors ORDER BY id
`;

/** Guard for ordinary public-segment deletion. Call inside the transaction that will delete this segment. */
export async function assertSegmentDeletionAllowed(id: string, manager: EntityManager): Promise<void> {
  if (!manager.queryRunner?.isTransactionActive) {
    throw new Error('Segment deletion guard requires an active transaction');
  }
  const [{ transaction_isolation: isolation }] = await manager.query('SHOW transaction_isolation');
  if (isolation !== 'read committed') {
    throw new Error('Segment deletion guard requires READ COMMITTED isolation');
  }

  // Cap each lock wait through cleanup/deletion; preserve any tighter caller/database limit.
  // Transaction-local settings expire on commit/rollback. This is not a total request deadline.
  await manager.query(`SELECT set_config('lock_timeout', CASE
    WHEN current_setting('lock_timeout')::interval = interval '0'
      OR current_setting('lock_timeout')::interval > interval '5 seconds'
    THEN '5s' ELSE current_setting('lock_timeout') END, true)`);

  // FOR UPDATE conflicts with the KEY SHARE locks taken by new foreign-key references.
  const [target] = await manager.query('SELECT id, type FROM segment WHERE id = $1 FOR UPDATE', [id]);
  if (!target) {
    throw new SegmentDeletionBlockedError(id, 'missing');
  }
  if (target.type !== SEGMENT_TYPE.PUBLIC) {
    throw new SegmentDeletionBlockedError(id, 'protected');
  }

  const locked = new Set<string>([id]);
  let ancestors: string[];
  let unlocked: string[];
  do {
    const rows: { id: string }[] = await manager.query(ancestorQuery, [id]);
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
  if (used) {
    throw new SegmentDeletionBlockedError(id, 'used');
  }
}
