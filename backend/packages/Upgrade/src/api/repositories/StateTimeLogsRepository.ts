import { StateTimeLog } from '../models/StateTimeLogs';
import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { EXPERIMENT_STATE } from 'upgrade_types';
import uuid from 'uuid';
import { Experiment } from '../models/Experiment';

@EntityRepository(StateTimeLog)
export class StateTimeLogsRepository extends Repository<StateTimeLog> {
  public async insertStateTimeLog(
    fromState: EXPERIMENT_STATE,
    toState: EXPERIMENT_STATE,
    timeLog: Date,
    experimentId: Experiment,
    entityManager?: EntityManager | any
  ): Promise<StateTimeLog> {
    entityManager = entityManager || this;
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(StateTimeLog)
      .values({
        id: uuid(),
        fromState,
        toState,
        timeLog,
        experiment: experimentId
      })
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
