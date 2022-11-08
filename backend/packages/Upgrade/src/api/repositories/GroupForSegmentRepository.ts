import { Repository, EntityRepository, EntityManager } from 'typeorm';
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
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(GroupForSegment)
      .values(data)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'groupForSegmentRepository',
          'insertGroupForSegment',
          { data },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
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

  public async deleteGroupForSegmentById(segmentId: string, logger: UpgradeLogger): Promise<GroupForSegment[]> {
    const result = await this.createQueryBuilder('groupForSegment')
      .delete()
      .from(GroupForSegment)
      .where('groupForSegment.segment=:segmentId', { segmentId })
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
