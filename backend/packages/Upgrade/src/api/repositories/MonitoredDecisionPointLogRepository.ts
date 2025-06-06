import { MonitoredDecisionPointLog } from '../models/MonitoredDecisionPointLog';
import { Repository } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';

export interface MonitoredDecisionPointLogDataCount {
  userId: string;
  site: string;
  target: string;
  count: number;
}

@EntityRepository(MonitoredDecisionPointLog)
export class MonitoredDecisionPointLogRepository extends Repository<MonitoredDecisionPointLog> {
  public async getAllMonitoredDecisionPointLog(
    userId: string,
    site: string[],
    target: string[],
    logger: UpgradeLogger
  ): Promise<MonitoredDecisionPointLogDataCount[]> {
    const result = await this.createQueryBuilder('mdpLog')
      .select(['mdp.userId as userId', 'mdp.site as site', 'mdp.target as target'])
      .addSelect('COUNT(*) as count')
      .leftJoin('mdpLog.monitoredDecisionPoint', 'mdp')
      .where('mdp.userId = :userId', { userId })
      .andWhere('mdp.site IN (:...site)', { site })
      .andWhere('mdp.target IN (:...target)', { target })
      .groupBy('mdp.userId , mdp.site , mdp.target, mdp.id')
      .getRawMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'monitoredDecisionPointLogRepository',
          'getAllMonitoredDecisionPointLog',
          {},
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result;
  }
}
