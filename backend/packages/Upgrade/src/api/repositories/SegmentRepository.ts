import { Repository, EntityRepository } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { Segment } from '../models/Segment';

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

  public async upsertSegment(data: Partial<Segment>, logger: UpgradeLogger): Promise<Segment> {
    const result = await this.createQueryBuilder()
      .insert()
      .into(Segment)
      .values(data)
      .onConflict(`("id") DO UPDATE SET "name" = :name, "description" = :description, "context" = :context`)
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
      .onConflict(`DO NOTHING`)
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
}
