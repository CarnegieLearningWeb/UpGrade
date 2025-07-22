import { RepeatedEnrollment } from '../models/RepeatedEnrollment';
import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import repositoryError from './utils/repositoryError';

export interface RepeatedEnrollmentDataCount {
  userId: string;
  decisionPointId: string;
  count: number;
}
@EntityRepository(RepeatedEnrollment)
export class RepeatedEnrollmentRepository extends Repository<RepeatedEnrollment> {
  public async getRepeatedEnrollmentCount(
    userId: string,
    decisionPointsIds: string[],
    logger: UpgradeLogger
  ): Promise<RepeatedEnrollmentDataCount[]> {
    const result = await this.createQueryBuilder('repeatedEnrollment')
      .select(['ie.userId as userId', 'ie.partitionId as decisionPointId'])
      .addSelect('COUNT(*) as count')
      .leftJoin('repeatedEnrollment.individualEnrollment', 'ie')
      .where('ie.userId = :userId', { userId })
      .andWhere('ie.partitionId IN (:...decisionPointsIds)', { decisionPointsIds })
      .groupBy('ie.userId , ie.partitionId , ie.id')
      .getRawMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'RepeatedEnrollmentRepository',
          'getRepeatedEnrollmentCount',
          {},
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result;
  }
}
