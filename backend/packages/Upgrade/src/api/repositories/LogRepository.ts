import { ExperimentRepository } from './ExperimentRepository';
import { IndividualEnrollment } from './../models/IndividualEnrollment';
import {
  EntityRepository,
  Repository,
  EntityManager,
  getRepository,
  SelectQueryBuilder,
  getCustomRepository,
} from 'typeorm';
import { Log } from '../models/Log';
import repositoryError from './utils/repositoryError';
import { Experiment } from '../models/Experiment';
import { OPERATION_TYPES, IMetricMetaData, REPEATED_MEASURE, EXPERIMENT_TYPE } from 'upgrade_types';
import { METRICS_JOIN_TEXT } from '../services/MetricService';
import { Query } from '../models/Query';
import { Metric } from '../models/Metric';
import { LevelCombinationElement } from '../models/LevelCombinationElement';

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
          throw errorMsgString;
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
          throw errorMsgString;
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
        throw errorMsgString;
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
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('LogRepository', 'deleteByMetricId', { metricKey }, errorMsg);
        throw errorMsgString;
      });

    const logIds: string[] = subQuery.map(({ id }) => id);

    let dataResult;
    if (logIds.length > 0) {
      dataResult = await this.createQueryBuilder('logs')
        .delete()
        .from(Log)
        .where('id NOT IN (:...logIds)', { logIds })
        .execute()
        .catch((errorMsg: any) => {
          const errorMsgString = repositoryError('LogRepository', 'deleteByMetricId', { metricKey }, errorMsg);
          throw errorMsgString;
        });
    } else {
      dataResult = await this.createQueryBuilder('logs')
        .delete()
        .from(Log)
        .execute()
        .catch((errorMsg: any) => {
          const errorMsgString = repositoryError('LogRepository', 'deleteByMetricId', { metricKey }, errorMsg);
          throw errorMsgString;
        });
    }

    return dataResult;
  }

  public async getMetricUniquifierData(
    filteredKeyUniqueArray: { key: string; uniquifier: string }[],
    userId: string
  ): Promise<{ data: Record<string, any>; uniquifier: string; timeStamp: string; id: string; key: string }[]> {
    const metricsRepository = getRepository(Metric);
    const values = filteredKeyUniqueArray
      .map((value) => {
        return `('${value.uniquifier}', '${value.key}')`;
      })
      .join(',');

    // Writing raw sql because querying composite column in Typeorm is not easily achievable
    const result =
      await metricsRepository.query(`SELECT data, uniquifier, "timeStamp" as "timeStamp", id, metric_log."metricKey" as key
                                      FROM log
                                      JOIN metric_log on metric_log."logId" = log.id
                                      WHERE (uniquifier, metric_log."metricKey") = ANY (VALUES${values})
                                      AND "userId"='${userId}'`);
    return result;
  }

  // TODO check if subQuery is better way of doing it
  public async getLogPerExperimentQueryForUser(
    experimentId: string,
    userIds: string[]
  ): Promise<
    Array<{
      data: Record<string, any>;
      id: string;
      name: string;
      repeatedMeasure: REPEATED_MEASURE;
      userId: string;
      createdAt: string;
      key: string;
      type: IMetricMetaData;
    }>
  > {
    const experimentRepo = getCustomRepository(ExperimentRepository, 'export');
    return experimentRepo
      .createQueryBuilder('experiment')
      .select([
        'logs.data as data',
        'queries.id as id',
        'queries.name as name',
        'queries."repeatedMeasure" as "repeatedMeasure"',
        'logs."userId" as "userId"',
        'logs."createdAt" as "createdAt"',
        'metric.key as key',
        'metric.type as type',
      ])
      .innerJoin('experiment.queries', 'queries')
      .innerJoin('queries.metric', 'metric')
      .innerJoin('metric.logs', 'logs')
      .where('experiment.id=:experimentId', { experimentId })
      .andWhere('logs."userId" IN (:...userIds)', { userIds })
      .execute();
  }

  public async analysis(query: Query): Promise<any> {
    const experimentId = query.experiment.id;
    const isFactorialExperiment = query.experiment.type === EXPERIMENT_TYPE.FACTORIAL;
    const metric = query.metric.key;
    const { operationType, compareFn, compareValue } = query.query;
    const { id: queryId, repeatedMeasure } = query;

    const metricId = metric.split(METRICS_JOIN_TEXT);
    let metricString = metricId.reduce((accumulator: string, value: string) => {
      return accumulator !== '' ? `${accumulator} -> '${value}'` : `'${value}'`;
    }, '');
    if (compareFn && metricId.length > 1) {
      metricString =
        metricString.substring(0, metricString.lastIndexOf('->')) +
        '->>' +
        metricString.substring(metricString.lastIndexOf('->') + 2, metricString.length);
    }

    // updating metric string to use logs.data
    let jsonDataValueLog = `sqlog.data -> ${metricString}`;
    let jsonDataValue = `logs.data -> ${metricString}`;
    if (compareFn && metricId.length <= 1) {
      jsonDataValueLog = `sqlog.data ->> ${metricString}`;
      jsonDataValue = `logs.data ->> ${metricString}`;
    }
    let executeQuery = this.getCommonAnalyticQuery(
      metric,
      experimentId,
      queryId,
      jsonDataValue,
      isFactorialExperiment
    );

    let valueToUse = 'extracted.value';
    let andQuery;
    if (query.metric.type == 'continuous') {
      andQuery = `jsonb_typeof(${jsonDataValueLog}) = 'number'`;
    } else {
      andQuery = `${jsonDataValueLog} IS NOT NULL`;
    }
    switch (repeatedMeasure) {
      case REPEATED_MEASURE.mostRecent:
        this.repeatedMeasureMostRecent(executeQuery, andQuery);
        break;
      case REPEATED_MEASURE.earliest:
        this.repeatedMeasureEarliest(executeQuery, andQuery);
        break;
      default:
        this.repeatedMeasureMean(executeQuery, jsonDataValue, andQuery);
        valueToUse = 'avg.avgval';
        break;
    }

    let percentQuery; // Used for percentage query
    if (compareFn) {
      const castType = query.metric.type === IMetricMetaData.CONTINUOUS ? 'decimal' : 'text';
      let castFn = `(cast(${valueToUse} as ${castType}))`;
      if (metricId.length > 1) {
        // When we have more than 1 key then we want ->> operator to get json value as text
        castFn = `(cast(${valueToUse} as ${castType}))`;
      }
      if (query.metric.type === IMetricMetaData.CATEGORICAL) {
        percentQuery = this.getCommonAnalyticQuery(
          metric,
          experimentId,
          queryId,
          jsonDataValue,
          isFactorialExperiment
        ).andWhere(`${castFn} In (:...allowedData)`, {
          allowedData: query.metric.allowedData,
        });

        percentQuery = isFactorialExperiment
          ? percentQuery.addGroupBy('"levelCombinationElement"."levelId"')
          : percentQuery.addGroupBy('"individualEnrollment"."conditionId"');
      }
      executeQuery = executeQuery.andWhere(`${castFn} ${compareFn} :compareValue`, {
        compareValue,
      });
    }
    executeQuery = isFactorialExperiment
      ? executeQuery.groupBy('"levelCombinationElement"."levelId"')
      : executeQuery.groupBy('"individualEnrollment"."conditionId"');
    if (operationType === OPERATION_TYPES.PERCENTAGE) {
      executeQuery = isFactorialExperiment
        ? executeQuery.select(['"levelCombinationElement"."levelId"', `count(cast(${valueToUse} as text)) as result`])
        : executeQuery.select(['"individualEnrollment"."conditionId"', `count(cast(${valueToUse} as text)) as result`]);
      percentQuery = isFactorialExperiment
        ? percentQuery.select(['"levelCombinationElement"."levelId"', `count(cast(${valueToUse} as text)) as result`])
        : percentQuery.select(['"individualEnrollment"."conditionId"', `count(cast(${valueToUse} as text)) as result`]);
      percentQuery.addSelect('COUNT(DISTINCT "individualEnrollment"."userId") as "participantsLogged"');
      const [executeQueryResult, percentQueryResult] = await Promise.all([
        executeQuery.getRawMany(),
        percentQuery.getRawMany(),
      ]);
      const result = executeQueryResult.map((res) => {
        if (isFactorialExperiment) {
          const { levelId } = res;
          const percentageQueryConditionRes = percentQueryResult.find((queryRes) => queryRes.levelId === levelId);
          return {
            levelId: levelId,
            result: (res.result / percentageQueryConditionRes.result) * 100,
            participantsLogged: percentageQueryConditionRes.participantsLogged
          };
        } else {
          const { conditionId } = res;
          const percentageQueryConditionRes = percentQueryResult.find(
            (queryRes) => queryRes.conditionId === conditionId
          );
          return {
            conditionId: conditionId,
            result: (res.result / percentageQueryConditionRes.result) * 100,
            participantsLogged: percentageQueryConditionRes.participantsLogged
          };
        }
      });
      return result;
    } else {
      if (operationType === OPERATION_TYPES.MEDIAN || operationType === OPERATION_TYPES.MODE) {
        const queryFunction = operationType === OPERATION_TYPES.MEDIAN ? 'percentile_cont(0.5)' : 'mode()';
        executeQuery = isFactorialExperiment
          ? executeQuery.select([
              '"levelCombinationElement"."levelId"',
              `${queryFunction} within group (order by (cast(${valueToUse} as decimal))) as result`,
            ])
          : executeQuery.select([
              '"individualEnrollment"."conditionId"',
              `${queryFunction} within group (order by (cast(${valueToUse} as decimal))) as result`,
            ]);
      } else if (operationType === OPERATION_TYPES.COUNT) {
        executeQuery = isFactorialExperiment
          ? executeQuery.select([
              '"levelCombinationElement"."levelId"',
              `${operationType}(cast(${valueToUse} as text)) as result`,
            ])
          : executeQuery.select([
              '"individualEnrollment"."conditionId"',
              `${operationType}(cast(${valueToUse} as text)) as result`,
            ]);
      } else {
        executeQuery = isFactorialExperiment
          ? executeQuery.select([
              '"levelCombinationElement"."levelId"',
              `${operationType}(cast(${valueToUse} as decimal)) as result`,
            ])
          : executeQuery.select([
              '"individualEnrollment"."conditionId"',
              `${operationType}(cast(${valueToUse} as decimal)) as result`,
            ]);
      }
      executeQuery.addSelect('COUNT(DISTINCT "individualEnrollment"."userId") as "participantsLogged"');
      return executeQuery.getRawMany();
    }
  }

  private repeatedMeasureMostRecent(query: SelectQueryBuilder<Experiment>, andQuery: string): SelectQueryBuilder<Experiment> {
    return query.andWhere((qb) => {
      const subQuery = qb
        .subQuery()
        .select('max(sqlog."createdAt")')
        .from(Log, 'sqlog')
        .where('sqlog."userId" = logs."userId"')
        .andWhere(andQuery)
        .getSql();
      return `logs."createdAt" = ${subQuery}`;
    });
  }

  private repeatedMeasureEarliest(query: SelectQueryBuilder<Experiment>, andQuery: string): SelectQueryBuilder<Experiment> {
    return query.andWhere((qb) => {
      const subQuery = qb
        .subQuery()
        .select('min(sqlog."createdAt")')
        .from(Log, 'sqlog')
        .where('sqlog."userId" = logs."userId"')
        .andWhere(andQuery)
        .getSql();
      return `logs."createdAt" = ${subQuery}`;
    });
  }

  private repeatedMeasureMean(
    query: SelectQueryBuilder<Experiment>,
    jsonDataValue: string,
    andQuery: string
  ): SelectQueryBuilder<Experiment> {
    return query
      .innerJoin(
        (qb) => {
          return qb
            .subQuery()
            .select([`avg(cast(${jsonDataValue} as decimal)) as avgval`, 'logs."userId" as "userId"'])
            .from(Log, 'logs')
            .groupBy('logs."userId"');
        },
        'avg',
        'avg."userId" = logs."userId"'
      )
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('min(sqlog."createdAt")')
          .from(Log, 'sqlog')
          .where('sqlog."userId" = logs."userId"')
          .andWhere(andQuery)
          .getSql();
        return `logs."createdAt" = ${subQuery}`;
      });
  }

  private getCommonAnalyticQuery(
    metric: string,
    experimentId: string,
    queryId: string,
    metricString: string,
    isFactorialExperiment: boolean
  ): SelectQueryBuilder<Experiment> {
    // get experiment repository
    const experimentRepo = getRepository(Experiment);

    let analyticsQuery = experimentRepo
      .createQueryBuilder('experiment')
      .innerJoin('experiment.queries', 'queries')
      .innerJoin('queries.metric', 'metric')
      .innerJoinAndSelect('metric.logs', 'logs')
      .innerJoinAndSelect(
        (qb) => {
          return qb
            .subQuery()
            .select([
              `"individualEnrollment"."userId" as "userId"`,
              `"individualEnrollment"."experimentId" as "experimentId"`,
              `"individualEnrollment"."conditionId" as "conditionId"`,
            ])
            .distinct()
            .from(IndividualEnrollment, 'individualEnrollment');
        },
        'individualEnrollment',
        'experiment.id = "individualEnrollment"."experimentId" AND logs."userId" = "individualEnrollment"."userId"'
      )
      .innerJoinAndSelect(
        (qb) => {
          return qb
            .subQuery()
            .select([`${metricString} as value`, 'logs.id as id'])
            .from(Log, 'logs');
        },
        'extracted',
        'extracted.id = logs.id'
      );

    if (isFactorialExperiment) {
      analyticsQuery = analyticsQuery.innerJoinAndSelect(
        (qb) => {
          return qb
            .subQuery()
            .select([
              `"levelCombinationElement"."conditionId" as "LCEconditionId"`,
              `"levelCombinationElement"."levelId" as "levelId"`,
            ])
            .distinct()
            .from(LevelCombinationElement, 'levelCombinationElement');
        },
        'levelCombinationElement',
        '"levelCombinationElement"."LCEconditionId" = "individualEnrollment"."conditionId"'
      );
    }

    analyticsQuery = analyticsQuery
      .where('metric.key = :metric', { metric })
      .andWhere('experiment.id = :experimentId', { experimentId })
      .andWhere('queries.id = :queryId', { queryId });

    return analyticsQuery;
  }
}
