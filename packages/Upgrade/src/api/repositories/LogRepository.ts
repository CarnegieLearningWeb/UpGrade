import { EntityRepository, Repository, EntityManager, getRepository } from 'typeorm';
import { Log } from '../models/Log';
import repositoryError from './utils/repositoryError';
import { Experiment } from '../models/Experiment';
import { IndividualAssignment } from '../models/IndividualAssignment';
import { OPERATION_TYPES } from 'upgrade_types';
import { METRICS_JOIN_TEXT } from '../services/MetricService';

@EntityRepository(Log)
export class LogRepository extends Repository<Log> {
  public async deleteExceptByIds(values: string[], entityManager: EntityManager): Promise<Log[]> {
    if (values.length > 0) {
      const result = await entityManager
        .createQueryBuilder()
        .delete()
        .from(Log)
        .where('id NOT IN (:...values)', { values })
        .execute()
        .catch((errorMsg: any) => {
          const errorMsgString = repositoryError(this.constructor.name, 'deleteExceptByIds', { values }, errorMsg);
          throw new Error(errorMsgString);
        });

      return result.raw;
    } else {
      const result = await entityManager
        .createQueryBuilder()
        .delete()
        .from(Log)
        .execute()
        .catch((errorMsg: any) => {
          const errorMsgString = repositoryError(this.constructor.name, 'deleteExceptByIds', { values }, errorMsg);
          throw new Error(errorMsgString);
        });

      return result.raw;
    }
  }

  public async analysis(
    experimentId: string,
    metric: string,
    operationType: OPERATION_TYPES,
    timeRange: any
  ): Promise<any> {
    // get experiment repository
    const experimentRepo = getRepository(Experiment);
    const metricId = metric.split(METRICS_JOIN_TEXT);
    const metricString = metricId.reduce((accumulator: string, value: string) => {
      return accumulator !== '' ? `${accumulator} -> '${value}'` : `'${value}'`;
    }, '');

    // SUM operation
    return experimentRepo
      .createQueryBuilder('experiment')
      .select([
        '"individualAssignment"."conditionId"',
        `${operationType}(cast(logs.data -> ${metricString} as decimal)) as result`,
      ])
      .innerJoin('experiment.queries', 'queries')
      .innerJoin('queries.metric', 'metric')
      .innerJoin('metric.logs', 'logs')
      .innerJoin(
        IndividualAssignment,
        'individualAssignment',
        'experiment.id = "individualAssignment"."experimentId" AND logs."userId" = "individualAssignment"."userId"'
      )
      .where('metric.key = :metric', { metric })
      .andWhere('experiment.id = :experimentId', { experimentId })
      .groupBy('"individualAssignment"."conditionId"')
      .getRawMany();
  }
}
