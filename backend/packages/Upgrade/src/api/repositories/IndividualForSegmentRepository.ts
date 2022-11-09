import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { IndividualForSegment } from '../models/IndividualForSegment';

@EntityRepository(IndividualForSegment)
export class IndividualForSegmentRepository extends Repository<IndividualForSegment> {
  public async getIndividualForSegmentById(segmentId: string, logger: UpgradeLogger): Promise<IndividualForSegment[]> {
    return this.createQueryBuilder('individualForSegment')
      .leftJoinAndSelect('individualForSegment.segment', 'segment')
      .leftJoinAndSelect('individualForSegment.user', 'user')
      .where('individualForSegment.segment=:segmentId', { segmentId })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'individualForSegmentRepository',
          'getIndividualForSegmentById',
          { segmentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
  }

  public async insertIndividualForSegment(
    data: Array<Partial<IndividualForSegment>>,
    entityManager: EntityManager,
    logger: UpgradeLogger
  ): Promise<IndividualForSegment[]> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(IndividualForSegment)
      .values(data)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'individualForSegmentRepository',
          'insertIndividualForSegment',
          { data },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteIndividualForSegment(
    segmentId: string,
    userId: string,
    logger: UpgradeLogger
  ): Promise<IndividualForSegment> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(IndividualForSegment)
      .where('segment=:segmentId AND user=:userId', { segmentId, userId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'individualForSegmentRepository',
          'deleteIndividualForSegment',
          { segmentId, userId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteIndividualForSegmentById(
    segmentId: string,
    logger: UpgradeLogger
  ): Promise<IndividualForSegment[]> {
    const result = await this.createQueryBuilder('individualForSegment')
      .delete()
      .from(IndividualForSegment)
      .where('individualForSegment.segment=:segmentId', { segmentId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'individualForSegmentRepository',
          'deleteIndividualForSegment',
          { segmentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}
