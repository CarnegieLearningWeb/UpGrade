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
