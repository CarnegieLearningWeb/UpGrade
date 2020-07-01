import { EntityRepository, Repository, EntityManager, getRepository } from 'typeorm';
import { Log } from '../models/Log';
import repositoryError from './utils/repositoryError';
import { Experiment } from '../models/Experiment';
import { IndividualAssignment } from '../models/IndividualAssignment';
import { OPERATION_TYPES, IMetricMetaData } from 'upgrade_types';
import { METRICS_JOIN_TEXT } from '../services/MetricService';
import { Query } from '../models/Query';
import { Metric } from '../models/Metric';

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

  public async updateLog(logId: string, data: any, timeStamp: Date): Promise<Log> {
    const result = await this.createQueryBuilder('log')
      .update()
      .set({ data, timeStamp })
      .where({ id: logId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('LogRepository', 'updateLog', { logId, data, timeStamp }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
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

  public async getMetricUniquifierData(metricKeys: string[], uniquifierKeys: string[], userId: string): Promise<any> {
    const metricsRepository = getRepository(Metric);

    return metricsRepository
      .createQueryBuilder('metric')
      .select([
        'logs.data as data',
        'logs.uniquifier as uniquifier',
        'logs."timeStamp" as timeStamp',
        'logs.id as id',
        'metric.key as key',
      ])
      .innerJoin('metric.logs', 'logs')
      .where('logs."userId" = :userId', { userId })
      .andWhere('logs.uniquifier IN (:...uniquifierKeys)', { uniquifierKeys })
      .andWhere('metric.key IN (:...metricKeys)', { metricKeys })
      .groupBy('logs.id')
      .addGroupBy('metric.key')
      .orderBy('logs."timeStamp"', 'DESC')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'getMetricUniquifierData',
          { metricKeys, uniquifierKeys },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async analysis(query: any): Promise<any> {
    const experimentId = query.experiment.id;
    const metric = query.metric.key;
    const { operationType, compareFn, compareValue } = query.query;
    const { id: queryId } = query;

    const metricId = metric.split(METRICS_JOIN_TEXT);
    const metricString = metricId.reduce((accumulator: string, value: string) => {
      return accumulator !== '' ? `${accumulator} -> '${value}'` : `'${value}'`;
    }, '');

    let executeQuery = this.getCommonAnalyticQuery(metric, experimentId, queryId);

    let percentQuery; // Used for percentage query
    if (compareFn) {
      const castType = query.metric.type === IMetricMetaData.CONTINUOUS ? 'decimal' : 'text';
      let castFn = `(cast(logs.data ->> ${metricString} as ${castType}))`;
      if (metricId.length > 1) {
        // When we have more than 1 key then we want ->> operator to get json value as text
        const val = metricString.substring(0, metricString.lastIndexOf('->')) + '->>'
          + metricString.substring(metricString.lastIndexOf('->') + 2, metricString.length);
        castFn = `(cast(logs.data -> ${val} as ${castType}))`;
      }
      if (query.metric.type === IMetricMetaData.CATEGORICAL) {
        percentQuery = this.getCommonAnalyticQuery(metric, experimentId, queryId)
          .andWhere(`${castFn} In (:...allowedData)`, {
            allowedData: query.metric.allowedData,
          })
          .groupBy('"individualAssignment"."conditionId"');
      }
      executeQuery = executeQuery.andWhere(`${castFn} ${compareFn} :compareValue`, {
        compareValue,
      });
    }
    executeQuery = executeQuery.groupBy('"individualAssignment"."conditionId"');
    if (operationType === OPERATION_TYPES.PERCENTAGE) {
      executeQuery = executeQuery.select([
        '"individualAssignment"."conditionId"',
        `count(cast(logs.data -> ${metricString} as text)) as result`,
      ]);
      percentQuery = percentQuery.select([
        '"individualAssignment"."conditionId"',
        `count(cast(logs.data -> ${metricString} as text)) as result`,
      ]);
      const executeQueryResult = await executeQuery.getRawMany();
      const percentQueryResult = await percentQuery.getRawMany();
      const result = executeQueryResult.map(res => {
        const { conditionId } = res;
        const percentageQueryConditionRes = percentQueryResult.find(queryRes => queryRes.conditionId === conditionId);
        return {
          conditionId,
          result: (res.result / percentageQueryConditionRes.result) * 100,
        };
      });
      return result;
    } else {
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

  private getCommonAnalyticQuery(metric: string, experimentId: string, queryId: string): any {
    // get experiment repository
    const experimentRepo = getRepository(Experiment);
    return experimentRepo
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
  }
}
