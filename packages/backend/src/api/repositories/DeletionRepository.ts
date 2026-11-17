import { EntityManager, Repository } from 'typeorm';
import {
  BatchDeleteEntity,
  EXPERIMENT_STATE,
  FEATURE_FLAG_STATUS,
  SEGMENT_TYPE,
  STANDARD_LIST_TYPE,
} from 'upgrade_types';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { Experiment } from '../models/Experiment';
import { FeatureFlag } from '../models/FeatureFlag';
import { Segment } from '../models/Segment';
import repositoryError from './utils/repositoryError';

/** The locked fields the deletion policy evaluates. Only the fields for the target's entity type are set. */
export interface DeletionTarget {
  id: string;
  state?: EXPERIMENT_STATE;
  status?: FEATURE_FLAG_STATUS;
  type?: SEGMENT_TYPE;
}

const policyFields = {
  experiments: { id: true, state: true },
  flags: { id: true, status: true },
  segments: { id: true, type: true },
};

/** All reads and locks use the caller's deletion transaction, never the repository's default manager. */
@EntityRepository()
export class DeletionRepository extends Repository<DeletionRepository> {
  public async findForDeletion(
    entity: BatchDeleteEntity,
    id: string,
    manager: EntityManager
  ): Promise<DeletionTarget | null> {
    const target = { experiments: Experiment, flags: FeatureFlag, segments: Segment }[entity];
    return manager
      .getRepository<DeletionTarget>(target)
      .findOne({ where: { id }, select: policyFields[entity], lock: { mode: 'pessimistic_write' } })
      .catch((errorMsg: any) => {
        throw repositoryError('DeletionRepository', 'findForDeletion', { entity, id }, errorMsg);
      });
  }

  /**
   * Whether a segment has the Used status that `SegmentService.getSegmentStatus()` reports, evaluated for one
   * segment instead of every segment. A segment is Used when it, or any segment that contains it, is a list of a
   * non-archived experiment or of any feature flag, or when it is a member of a segment-type list that belongs to
   * another segment.
   */
  public async isSegmentInUse(segmentId: string, manager: EntityManager): Promise<boolean> {
    const rows: { used: boolean }[] = await manager
      .query(
        `WITH RECURSIVE containing ("id") AS (
          SELECT $1::uuid
          UNION
          SELECT sfs."parentSegmentId" FROM "segment_for_segment" sfs JOIN containing c ON sfs."childSegmentId" = c."id"
        )
        SELECT (
          EXISTS (
            SELECT 1 FROM "experiment_segment_inclusion" esi JOIN "experiment" e ON e."id" = esi."experimentId"
            WHERE esi."segmentId" IN (SELECT "id" FROM containing) AND e."state" <> $2
          )
          OR EXISTS (
            SELECT 1 FROM "experiment_segment_exclusion" ese JOIN "experiment" e ON e."id" = ese."experimentId"
            WHERE ese."segmentId" IN (SELECT "id" FROM containing) AND e."state" <> $2
          )
          OR EXISTS (SELECT 1 FROM "feature_flag_segment_inclusion" WHERE "segmentId" IN (SELECT "id" FROM containing))
          OR EXISTS (SELECT 1 FROM "feature_flag_segment_exclusion" WHERE "segmentId" IN (SELECT "id" FROM containing))
          OR EXISTS (
            SELECT 1 FROM "segment_for_segment" m JOIN "segment" l ON l."id" = m."parentSegmentId"
            WHERE m."childSegmentId" = $1 AND l."listType" = $3
              AND EXISTS (SELECT 1 FROM "segment_for_segment" o WHERE o."childSegmentId" = l."id")
          )
        ) AS "used"`,
        [segmentId, EXPERIMENT_STATE.ARCHIVED, STANDARD_LIST_TYPE.SEGMENT]
      )
      .catch((errorMsg: any) => {
        throw repositoryError('DeletionRepository', 'isSegmentInUse', { segmentId }, errorMsg);
      });
    return rows[0]?.used === true;
  }
}
