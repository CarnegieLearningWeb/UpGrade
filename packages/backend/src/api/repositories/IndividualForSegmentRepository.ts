import { Repository, EntityManager } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
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
    if (!data.length) return [];

    // PostgreSQL's wire protocol supports at most 65535 bind parameters per statement.
    // IndividualForSegment has 2 bound columns (segmentId, userId), so cap at 5000 rows
    // per chunk (5000 × 2 = 10000, well under the limit).
    const CHUNK_SIZE = 5000;
    const results: IndividualForSegment[] = [];

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      const result = await entityManager
        .createQueryBuilder()
        .insert()
        .into(IndividualForSegment)
        .values(chunk)
        .orIgnore()
        .returning('*')
        .execute()
        .catch((errorMsg: any) => {
          const errorMsgString = repositoryError(
            'individualForSegmentRepository',
            'insertIndividualForSegment',
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
    entityManager: EntityManager,
    logger: UpgradeLogger
  ): Promise<IndividualForSegment[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(IndividualForSegment)
      .where('segment=:segmentId', { segmentId })
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
