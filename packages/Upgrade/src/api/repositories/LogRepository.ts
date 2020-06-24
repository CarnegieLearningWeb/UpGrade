import { EntityRepository, Repository, EntityManager, getRepository } from 'typeorm';
import { Log } from '../models/Log';
import repositoryError from './utils/repositoryError';
import { Experiment } from '../models/Experiment';
import { IndividualAssignment } from '../models/IndividualAssignment';
import { OPERATION_TYPES } from 'upgrade_types';
import { METRICS_JOIN_TEXT } from '../services/MetricService';
import { Query } from '../models/Query';

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

  public async deleteByMetricId(metricKey: string): Promise<any> {
    const queryRepo = getRepository(Query);

    // delete all logs
    // TODO optimize this query
    const subQuery = await queryRepo
      .createQueryBuilder('query')
      .select('DISTINCT(logs.id)')
      .innerJoin('query.metric', 'metric')
      .innerJoin('metric.logs', 'logs')
      .execute();

    const logIds: string[] = subQuery.map(({ id }) => id);

    let dataResult;
    if (logIds.length > 0) {
      dataResult = await this.createQueryBuilder('logs')
        .delete()
        .from(Log)
        .where('id NOT IN (:...logIds)', { logIds })
        .execute();
    } else {
      dataResult = await this.createQueryBuilder('logs').delete().from(Log).execute();
    }

    return dataResult;
  }

  public async analysis(query: any): Promise<any> {
    const experimentId = query.experiment.id;
    const metric = query.metric.key;
    const { operationType, compareFn, compareValue } = query.query;
    const { id: queryId } = query;

    // get experiment repository
    const experimentRepo = getRepository(Experiment);
    const metricId = metric.split(METRICS_JOIN_TEXT);
    const metricString = metricId.reduce((accumulator: string, value: string) => {
      // TODO: Fix nested query
      return accumulator !== '' ? `${accumulator} -> '${value}'` : `'${value}'`;
    }, '');

    let executeQuery = experimentRepo
      .createQueryBuilder('experiment')
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
      .andWhere('queries.id = :queryId', { queryId });

    if (compareFn) {
      executeQuery = executeQuery.andWhere(`(cast(logs.data -> ${metricString} as text)) ${compareFn} :compareValue`, {
        compareValue,
      });
    }
    // TODO: Form properly
    executeQuery = executeQuery.groupBy('"individualAssignment"."conditionId"');
    // let castType = 'decimal';
    // if (query.metric.type === IMetricMetaData.CATEGORICAL) {
    //   castType = 'text';
    // }
    if (operationType === OPERATION_TYPES.MEDIAN || operationType === OPERATION_TYPES.MODE) {
      const queryFunction = operationType === OPERATION_TYPES.MEDIAN ? 'percentile_cont(0.5)' : 'mode()';
      executeQuery = executeQuery.select([
        '"individualAssignment"."conditionId"',
        `${queryFunction} within group (order by (cast(logs.data -> ${metricString} as decimal))) as result`,
      ]);
    } else if (operationType === OPERATION_TYPES.COUNT) {
      executeQuery = executeQuery.select([
        '"individualAssignment"."conditionId"',
        `${operationType}(cast(logs.data -> ${metricString} as text)) as result`,
      ]);
    } else {
      executeQuery = executeQuery.select([
        '"individualAssignment"."conditionId"',
        `${operationType}(cast(logs.data -> ${metricString} as decimal)) as result`,
      ]);
    }
    return executeQuery.getRawMany();
  }
}
