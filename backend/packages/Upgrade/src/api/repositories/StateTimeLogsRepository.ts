import { StateTimeLog } from '../models/StateTimeLogs';
import { Repository, EntityRepository } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { EXPERIMENT_STATE } from 'upgrade_types';


@EntityRepository(StateTimeLog)
export class StateTimeLogsRepository extends Repository<StateTimeLog> {
  public async insertStateTimeLog(
    fromState: EXPERIMENT_STATE,
    toState: EXPERIMENT_STATE,
    timeLog: Date,
    experimentId: string,
  ): Promise<StateTimeLog> {
    const result = await this.createQueryBuilder('StateTimeLog')
      .insert()
      .into(StateTimeLog)
      .setParameter('fromState', fromState)
      .setParameter('toState', toState)
      .setParameter('timeLog', timeLog)
      .setParameter('experimentId', experimentId)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'StateTimeLogsRepository',
          'insertStateTimeLog',
          { fromState, toState, timeLog, experimentId },
          errorMsg
        );
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

}
