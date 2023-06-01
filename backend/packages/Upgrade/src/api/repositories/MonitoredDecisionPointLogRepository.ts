import { MonitoredDecisionPointLog } from '../models/MonitoredDecisionPointLog';
import { Repository, EntityRepository } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';

@EntityRepository(MonitoredDecisionPointLog)
export class MonitoredDecisionPointLogRepository extends Repository<MonitoredDecisionPointLog> {
  public async getAllMonitoredDecisionPointLog(
    userId: string,
    site: string,
    target: string,
    logger: UpgradeLogger
  ): Promise<any> {
    const result = await this.createQueryBuilder()
      .from('monitored_decision_point_log', 'log')
      .leftJoin('log.monitoredDecisionPoint', 'mdp')
      .where('mdp.userId = :userId', { userId })
      .andWhere('mdp.site = :site', { site })
      .andWhere('mdp.target = :target', { target })
      .getCount()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'monitoredDecisionPointLogRepository',
          'getAllmonitoredDecisionPointLog',
          {},
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result;
  }
}
