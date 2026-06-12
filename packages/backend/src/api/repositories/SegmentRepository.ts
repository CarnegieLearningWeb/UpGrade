import { EntityManager, Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { Segment } from '../models/Segment';
import { SEGMENT_TYPE } from 'upgrade_types';

@EntityRepository(Segment)
export class SegmentRepository extends Repository<Segment> {
  public async getAllSegments(logger: UpgradeLogger): Promise<Segment[]> {
    return await this.createQueryBuilder('segment')
      .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('segmentRepository', 'getAllSegments', {}, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async getSegmentById(id: string, logger: UpgradeLogger): Promise<Segment> {
    return await this.createQueryBuilder('segment')
      .where('segment.id=:id', { id })
      .getOne()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('segmentRepository', 'getSegmentById', { id }, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  /**
   * Retrieves all segments of a specified type from the database.
   *
   * @param type - The type of segments to retrieve.
   * @param logger - The logger instance for logging errors.
   * @returns A promise that resolves to an array of segments.
   * @throws Will throw an error if there is an issue with the database query.
   */
  public async getAllSegmentByType(type: SEGMENT_TYPE, logger: UpgradeLogger): Promise<Segment[]> {
    return await this.createQueryBuilder('segment')
      .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segment.subSegments', 'subSegments')
      .where('segment.type=:type', { type })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('segmentRepository', 'getAllSegmentByType', {}, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async getAllParentSegments(): Promise<Segment[]> {
    return this.createQueryBuilder('segment')
      .leftJoinAndSelect('segment.subSegments', 'subSegments')
      .leftJoinAndSelect('subSegments.subSegments', 'subSubSegments')
      .where('subSegments.listType=:type', { type: 'Segment' })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('segmentRepository', 'getAllParentSegments', {}, errorMsg);
        throw errorMsgString;
      });
  }

  /**
   * Finds a single segment by its context and type.
   *
   * @param context - The context of the segment to find.
   * @param type - The type of the segment to find.
   * @returns A promise that resolves to the found segment.
   * @throws Will throw an error message string if the query fails.
   */
  public async findOneSegmentByContextAndType(context: string, type: SEGMENT_TYPE): Promise<Segment> {
    return await this.createQueryBuilder('segment')
      .where('segment.context=:context', { context })
      .andWhere('segment.type=:type', { type })
      .getOne()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'segmentRepository',
          'findOneSegmentByContextAndType',
          { context, type },
          errorMsg
        );
        throw errorMsgString;
      });
  }

  public async upsertSegment(data: Partial<Segment>, logger: UpgradeLogger): Promise<Segment> {
    const result = await this.createQueryBuilder()
      .insert()
      .into(Segment)
      .values(data)
      .orUpdate(['name', 'description', 'context'], ['id'])
      .setParameter('name', data.name)
      .setParameter('description', data.description)
      .setParameter('context', data.context)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('segmentRepository', 'insertSegment', { data }, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result.raw[0];
  }

  public async insertSegment(data: Partial<Segment>, logger: UpgradeLogger): Promise<Segment> {
    const result = await this.createQueryBuilder('segment')
      .insert()
      .into(Segment)
      .values(data)
      .orIgnore()
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('segmentRepository', 'insertSegment', { data }, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteSegment(id: string, logger: UpgradeLogger): Promise<Segment> {
    const result = await this.createQueryBuilder('segment')
      .delete()
      .from(Segment)
      .where('segment.id=:id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('segmentRepository', 'deleteSegmentById', { id }, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }

  /**
   * Checks whether a user (by individual ID or working group membership) belongs to any segment
   * in the tree rooted at the given segment IDs, traversing sub-segments recursively via a
   * single recursive CTE. Returns a boolean for individual membership and the subset of the
   * user's groups that matched — no member lists are loaded into application memory.
   */
  public async checkMembershipForUser(
    segmentIds: string[],
    userId: string,
    userGroups: { type: string; groupId: string }[]
  ): Promise<{ isIndividualMember: boolean; matchedGroups: { type: string; groupId: string }[] }> {
    if (!segmentIds.length) {
      return { isIndividualMember: false, matchedGroups: [] };
    }

    // Traverse the full segment tree (including sub-segments) in one recursive CTE.
    // segment_for_segment join direction: parentSegmentId = parent, childSegmentId = child (sub-segment).
    // The EXISTS sub-queries do indexed point lookups — no member rows are returned to the app.
    const result = await this.manager.query(
      `
      WITH RECURSIVE segment_tree AS (
        SELECT id FROM segment WHERE id = ANY($1::uuid[])
        UNION
        SELECT child.id
        FROM segment child
        INNER JOIN segment_for_segment sfs ON sfs."childSegmentId" = child.id
        INNER JOIN segment_tree st ON st.id = sfs."parentSegmentId"
      )
      SELECT
        EXISTS(
          SELECT 1 FROM individual_for_segment ifs
          INNER JOIN segment_tree st ON st.id = ifs."segmentId"
          WHERE ifs."userId" = $2
        ) AS is_individual_member,
        COALESCE(
          (
            SELECT json_agg(json_build_object('type', gfs.type, 'groupId', gfs."groupId"))
            FROM group_for_segment gfs
            INNER JOIN segment_tree st ON st.id = gfs."segmentId"
          ),
          '[]'::json
        ) AS segment_groups
      `,
      [segmentIds, userId]
    );

    const { is_individual_member, segment_groups } = result[0];
    const allGroups: { type: string; groupId: string }[] = segment_groups;

    // Filter to only the groups the requesting user actually belongs to.
    const matchedGroups = allGroups.filter((g) =>
      userGroups.some((ug) => ug.type === g.type && ug.groupId === g.groupId)
    );

    return { isIndividualMember: is_individual_member, matchedGroups };
  }

  public async deleteSegments(ids: string[], logger: UpgradeLogger, entityManager?: EntityManager): Promise<Segment[]> {
    const queryRunner = entityManager ? entityManager : this;

    const result = await queryRunner
      .createQueryBuilder()
      .delete()
      .from(Segment)
      .where('segment.id IN (:...ids)', { ids })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('segmentRepository', 'deleteSegmentsByIds', { ids }, errorMsg);
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}
