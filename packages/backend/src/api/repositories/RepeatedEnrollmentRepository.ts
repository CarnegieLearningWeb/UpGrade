import { RepeatedEnrollment } from '../models/RepeatedEnrollment';
import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import repositoryError from './utils/repositoryError';

export interface RepeatedEnrollmentDataCount {
  userId: string;
  experimentId: string;
  count: number;
}
@EntityRepository(RepeatedEnrollment)
export class RepeatedEnrollmentRepository extends Repository<RepeatedEnrollment> {
  public async getRepeatedEnrollmentCount(
    userId: string,
    experimentIds: string[],
    logger: UpgradeLogger
  ): Promise<RepeatedEnrollmentDataCount[]> {
    const result = await this.createQueryBuilder('repeatedEnrollment')
      .select(['ie.userId as "userId"', 'ie.experimentId as "experimentId"'])
      .addSelect('COUNT(*) as count')
      .leftJoin('repeatedEnrollment.individualEnrollment', 'ie')
      .leftJoin('ie.experiment', 'experiment')
      .where('ie.userId = :userId', { userId })
      .andWhere('ie.experimentId IN (:...experimentIds)', { experimentIds })
      .groupBy('ie.userId , ie.experimentId , ie.id')
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
