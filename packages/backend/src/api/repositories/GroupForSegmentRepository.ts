import { Repository, EntityManager } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { GroupForSegment } from '../models/GroupForSegment';

@EntityRepository(GroupForSegment)
export class GroupForSegmentRepository extends Repository<GroupForSegment> {
  public async getGroupForSegmentById(segmentId: string, logger: UpgradeLogger): Promise<GroupForSegment[]> {
    return this.createQueryBuilder('groupForSegment')
      .leftJoinAndSelect('groupForSegment.segment', 'segment')
      .where('groupForSegment.segment=:segmentId', { segmentId })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'groupForSegmentRepository',
          'getGroupForSegmentById',
          { segmentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async insertGroupForSegment(
    data: Array<Partial<GroupForSegment>>,
    entityManager: EntityManager,
    logger: UpgradeLogger
  ): Promise<GroupForSegment[]> {
    if (!data.length) return [];

    // PostgreSQL's wire protocol supports at most 65535 bind parameters per statement.
    // GroupForSegment has 3 bound columns (segmentId, groupId, type), so cap at 5000 rows
    // per chunk (5000 × 3 = 15000, well under the limit).
    const CHUNK_SIZE = 5000;
    const results: GroupForSegment[] = [];

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      const result = await entityManager
        .createQueryBuilder()
        .insert()
        .into(GroupForSegment)
        .values(chunk)
        .orIgnore()
        .returning('*')
        .execute()
        .catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'groupForSegmentRepository',
            'insertGroupForSegment',
            { data: chunk },
            errorMsg
          );
          logger.error(errorMsg);
          throw errorMsgString;
        });
      results.push(...result.raw);
    }

    return results;
  }

  public async deleteGroupForSegment(
    segmentId: string,
    groupId: string,
    type: string,
    logger: UpgradeLogger
  ): Promise<GroupForSegment> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(GroupForSegment)
      .where('segment=:segmentId AND groupId=:groupId AND type=:type', { segmentId, groupId, type })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'groupForSegmentRepository',
          'deleteGroupForSegment',
          { segmentId, groupId, type },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteGroupForSegmentById(
    segmentId: string,
    entityManager: EntityManager,
    logger: UpgradeLogger
  ): Promise<GroupForSegment[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(GroupForSegment)
      .where('segment=:segmentId', { segmentId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'groupForSegmentRepository',
          'deleteGroupForSegment',
          { segmentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}
