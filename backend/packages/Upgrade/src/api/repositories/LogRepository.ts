import { ExperimentRepository } from './ExperimentRepository';
import { IndividualEnrollment } from './../models/IndividualEnrollment';
import {
  EntityRepository,
  Repository,
  EntityManager,
  getRepository,
  SelectQueryBuilder,
  getCustomRepository,
  getManager,
} from 'typeorm';
import { Log } from '../models/Log';
import repositoryError from './utils/repositoryError';
import { Experiment } from '../models/Experiment';
import { OPERATION_TYPES, IMetricMetaData, REPEATED_MEASURE, EXPERIMENT_TYPE } from 'upgrade_types';
import { METRICS_JOIN_TEXT } from '../services/MetricService';
import { Query } from '../models/Query';
import { Metric } from '../models/Metric';
import { LevelCombinationElement } from '../models/LevelCombinationElement';
import { MonitoredDecisionPoint } from '../models/MonitoredDecisionPoint';
import { MonitoredDecisionPointLog } from '../models/MonitoredDecisionPointLog';
import { ExperimentCondition } from '../models/ExperimentCondition';

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
      updatedAt: string;
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
        'logs."updatedAt" as "updatedAt"',
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

  public prepareMetricString(metricId: string[], compareFn: string) {
    let metricString = metricId.reduce((accumulator: string, value: string) => {
      return accumulator !== '' ? `${accumulator} -> '${value}'` : `'${value}'`;
    }, '');
    if (compareFn && metricId.length > 1) {
      metricString =
        metricString.substring(0, metricString.lastIndexOf('->')) +
        '->>' +
        metricString.substring(metricString.lastIndexOf('->') + 2, metricString.length);
    }
    return metricString;
  }

  public calculatePercentageResult(executeQueryResult, percentQueryResult, isFactorialExperiment: boolean) {
    const result = executeQueryResult.map((res) => {
      if (isFactorialExperiment) {
        const { levelId } = res;
        const percentageQueryConditionRes = percentQueryResult.find((queryRes) => queryRes.levelId === levelId);
        return {
          levelId: levelId,
          result: (res.result / percentageQueryConditionRes.result) * 100,
          participantsLogged: percentageQueryConditionRes.participantsLogged,
        };
      } else {
        const { conditionId } = res;
        const percentageQueryConditionRes = percentQueryResult.find(
          (queryRes) => queryRes.conditionId === conditionId
        );
        return {
          conditionId: conditionId,
          result: (res.result / percentageQueryConditionRes.result) * 100,
          participantsLogged: percentageQueryConditionRes.participantsLogged,
        };
      }
    });
    return result;
  }

  public async analysis(query: Query): Promise<any> {
    const {
      id: queryId,
      metric: { key: metricKey, type: metricType, allowedData },
      experiment: { id: experimentId, assignmentUnit: unitOfAssignment, type: experimentType },
      query: { operationType, compareFn, compareValue },
      repeatedMeasure,
    } = query;
  
    const metricId = metricKey.split(METRICS_JOIN_TEXT);
    const isFactorialExperiment = experimentType === EXPERIMENT_TYPE.FACTORIAL;
    const isContinuousMetric = metricType === 'continuous';
    const metricString = this.prepareMetricString(metricId, compareFn);
    const operation = repeatedMeasure === REPEATED_MEASURE.earliest ? 'min' : 'max';
    const queryFunction = operationType === OPERATION_TYPES.MEDIAN ? 'percentile_cont(0.5)' : 'mode()';
  
    const jsonDataValueLog = compareFn && metricId.length <= 1 ? `sqlog.data ->> ${metricString}` : `sqlog.data -> ${metricString}`;
    const jsonDataValue = `logs.data -> ${metricString}`;

    // main query to execute:
    let executeQuery = this.getCommonAnalyticQuery(
      metricKey,
      experimentId,
      queryId,
      jsonDataValue,
      isFactorialExperiment,
      unitOfAssignment
    );
    
    let andQuery = isContinuousMetric ? `jsonb_typeof(${jsonDataValueLog}) = 'number'` : `${jsonDataValueLog} IS NOT NULL`;

    let valueToUse = this.addRepeatedMeasureQuery(
      repeatedMeasure,
      executeQuery,
      andQuery,
      jsonDataValue,
      unitOfAssignment
    );

    let percentQuery; // Used for percentage query

    if (compareFn) {
      const castType = isContinuousMetric ? 'decimal' : 'text';
      let castFn = `(cast(${valueToUse} as ${castType}))`;
      
      percentQuery = (unitOfAssignment !== 'within-subjects') ?
        this.getCommonAnalyticQuery(
          metricKey,
          experimentId,
          queryId,
          jsonDataValue,
          isFactorialExperiment,
          unitOfAssignment
        ).andWhere(`${castFn} In (:...allowedData)`, {
          allowedData,
        }) : this.getCommonAnalyticQuery(
              metricKey,
              experimentId,
              queryId,
              jsonDataValue,
              isFactorialExperiment,
              unitOfAssignment
            );

      valueToUse = this.addRepeatedMeasureQuery(
        repeatedMeasure,
        percentQuery,
        andQuery,
        jsonDataValue,
        unitOfAssignment
      );

      percentQuery = (unitOfAssignment !== 'within-subjects') ? (isFactorialExperiment
        ? percentQuery.addGroupBy('"levelCombinationElement"."levelId"')
        : percentQuery.addGroupBy('"individualEnrollment"."conditionId"')) : 
        (isFactorialExperiment
        ? percentQuery.addGroupBy('"levelCombinationElement"."levelId", "monitoredDecisionPoint"."userId"')
        : percentQuery.addGroupBy('"experimentCondition"."conditionId", "monitoredDecisionPoint"."userId"'));

      executeQuery = executeQuery.andWhere(`${castFn} ${compareFn} :compareValue`, {
        compareValue,
      });
    }

    if (unitOfAssignment !== 'within-subjects') {
      executeQuery = isFactorialExperiment
        ? executeQuery.groupBy('"levelCombinationElement"."levelId"')
        : executeQuery.groupBy('"individualEnrollment"."conditionId"');
    } else {
      if (operationType === OPERATION_TYPES.STDEV) {
        executeQuery = isFactorialExperiment
        ? executeQuery.groupBy(`"levelCombinationElement"."levelId", "monitoredDecisionPoint"."userId", ${valueToUse}`)
        : executeQuery.groupBy(`"experimentCondition"."conditionId", "monitoredDecisionPoint"."userId", ${valueToUse}`);
      } else {
        if (operationType !== OPERATION_TYPES.PERCENTAGE) {
          executeQuery = isFactorialExperiment
            ? executeQuery.groupBy('"levelCombinationElement"."levelId", "monitoredDecisionPoint"."userId"')
            : executeQuery.groupBy('"experimentCondition"."conditionId", "monitoredDecisionPoint"."userId"');
        }
        }
    }

    if (operationType === OPERATION_TYPES.PERCENTAGE) {
      if (unitOfAssignment !== 'within-subjects') {
        executeQuery = isFactorialExperiment
          ? executeQuery.select(['"levelCombinationElement"."levelId"', `count(cast(${valueToUse} as text)) as result`])
          : executeQuery.select([
              '"individualEnrollment"."conditionId"',
              `count(cast(${valueToUse} as text)) as result`,
            ]);
        percentQuery = isFactorialExperiment
          ? percentQuery.select(['"levelCombinationElement"."levelId"', `count(cast(${valueToUse} as text)) as result`])
          : percentQuery.select([
              '"individualEnrollment"."conditionId"',
              `count(cast(${valueToUse} as text)) as result`,
            ]);
      } else {
        executeQuery = isFactorialExperiment
            ? executeQuery.groupBy('"levelCombinationElement"."levelId"')
            : executeQuery.groupBy('"experimentCondition"."conditionId"');
        executeQuery = isFactorialExperiment
          ? executeQuery.select([
              '"levelCombinationElement"."levelId"',
              `count(cast(${valueToUse} as text)) as result`,
              `${operation}("logs"."updatedAt")`,
            ])
          : executeQuery.select([
              '"experimentCondition"."conditionId"',
              `count(cast(${valueToUse} as text)) as result`,
              `${operation}("logs"."updatedAt")`,
            ]);
        percentQuery = isFactorialExperiment
          ? percentQuery.select([
              '"levelCombinationElement"."levelId"',
              `${operation}(cast(${valueToUse} as text)) as result`,
              `${operation}("logs"."updatedAt")`,
              `"monitoredDecisionPoint"."userId" as "userId"`,
            ])
          : percentQuery.select([
              '"experimentCondition"."conditionId"',
              `${operation}(cast(${valueToUse} as text)) as result`,
              `${operation}("logs"."updatedAt")`,
              `"monitoredDecisionPoint"."userId" as "userId"`,
            ]);
      }

      percentQuery.addSelect('COUNT(DISTINCT "individualEnrollment"."userId") as "participantsLogged"');

      if (unitOfAssignment === 'within-subjects') {
        let conditionOrLevelId = isFactorialExperiment ? "levelId" : "conditionId"; 
        const withinSubjectPercentQuery = getManager()
          .createQueryBuilder()
          .select([
            `subquery."${conditionOrLevelId}"`,
            `COUNT(subquery."result") as "result"`,
            `COUNT(DISTINCT subquery."userId") as "participantsLogged"`,
          ])
          .addFrom('(' + percentQuery.getQuery() + ')', 'subquery')
          .andWhere(`subquery."result" In (:...allowedData)`, {
            allowedData,
          })
          .groupBy(`subquery."${conditionOrLevelId}"`)
          .setParameters(percentQuery.getParameters());
        percentQuery = withinSubjectPercentQuery;
      }

      const [executeQueryResult, percentQueryResult] = await Promise.all([
        executeQuery.getRawMany(),
        percentQuery.getRawMany(),
      ]);

      // calculate percentage:
      return this.calculatePercentageResult(executeQueryResult, percentQueryResult, isFactorialExperiment);

    } else {
      // For Median, Mode, Count, Sum, Min, Max, Average/Mean, Standard Deviation
      if (operationType === OPERATION_TYPES.MEDIAN || operationType === OPERATION_TYPES.MODE) {
        if (unitOfAssignment !== 'within-subjects') {
          executeQuery = isFactorialExperiment
            ? executeQuery.select([
                '"levelCombinationElement"."levelId"',
                `${queryFunction} within group (order by (cast(${valueToUse} as decimal))) as result`,
              ])
            : executeQuery.select([
                '"individualEnrollment"."conditionId"',
                `${queryFunction} within group (order by (cast(${valueToUse} as decimal))) as result`,
              ]);
        } else {
          executeQuery = isFactorialExperiment
            ? executeQuery.select([
                '"levelCombinationElement"."levelId"',
                `${queryFunction} within group (order by (cast(${valueToUse} as decimal))) as result`,
                `${operation}("logs"."updatedAt")`,
                `"monitoredDecisionPoint"."userId" as "userId"`,
              ])
            : executeQuery.select([
                '"experimentCondition"."conditionId"',
                `${queryFunction} within group (order by (cast(${valueToUse} as decimal))) as result`,
                `${operation}("logs"."updatedAt")`,
                `"monitoredDecisionPoint"."userId" as "userId"`,
              ]);
        }
      } else if (operationType === OPERATION_TYPES.COUNT) {
        if (unitOfAssignment !== 'within-subjects') {
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
                `${operationType}(cast(${valueToUse} as text)) as result`,
                `${operation}("logs"."updatedAt")`,
                `"monitoredDecisionPoint"."userId" as "userId"`,
              ])
            : executeQuery.select([
                '"experimentCondition"."conditionId"',
                `${operationType}(cast(${valueToUse} as text)) as result`,
                `${operation}("logs"."updatedAt")`,
                `"monitoredDecisionPoint"."userId" as "userId"`,
              ]);
        }
      } else {
        // For Sum, Min, Max, Average/Mean, Standard Deviation
        if (unitOfAssignment !== 'within-subjects') {
          executeQuery = isFactorialExperiment
            ? executeQuery.select([
                '"levelCombinationElement"."levelId"',
                `${operationType}(cast(${valueToUse} as decimal)) as result`,
              ])
            : executeQuery.select([
                '"individualEnrollment"."conditionId"',
                `${operationType}(cast(${valueToUse} as decimal)) as result`,
              ]);
        } else {
          if (operationType !== OPERATION_TYPES.STDEV) {
            executeQuery = isFactorialExperiment
              ? executeQuery.select([
                  '"levelCombinationElement"."levelId"',
                  `${operationType}(cast(${valueToUse} as decimal)) as result`,
                  `${operation}("logs"."updatedAt")`,
                  `"monitoredDecisionPoint"."userId" as "userId"`,
                ])
              : executeQuery.select([
                  '"experimentCondition"."conditionId"',
                  `${operationType}(cast(${valueToUse} as decimal)) as result`,
                  `${operation}("logs"."updatedAt")`,
                  `"monitoredDecisionPoint"."userId" as "userId"`,
                ]);
          } else { // for stdev dont have operationType in subquery
            executeQuery = isFactorialExperiment
              ? executeQuery.select([
                  '"levelCombinationElement"."levelId"',
                  `cast(${valueToUse} as decimal) as result`,
                  `${operation}("logs"."updatedAt")`,
                  `"monitoredDecisionPoint"."userId" as "userId"`,
                ])
              : executeQuery.select([
                  '"experimentCondition"."conditionId"',
                  `cast(${valueToUse} as decimal) as result`,
                  `${operation}("logs"."updatedAt")`,
                  `"monitoredDecisionPoint"."userId" as "userId"`,
                ]);
          }
        }
      }

      executeQuery.addSelect('COUNT(DISTINCT "individualEnrollment"."userId") as "participantsLogged"');

      if (unitOfAssignment === 'within-subjects') {
        let withinSubjectExecuteQuery;
        let conditionOrLevelId = isFactorialExperiment ? "levelId" : "conditionId"; 
        if (operationType === OPERATION_TYPES.MEDIAN || operationType === OPERATION_TYPES.MODE) {
          withinSubjectExecuteQuery = getManager()
            .createQueryBuilder()
            .select([
              `subquery."${conditionOrLevelId}"`,
              `${queryFunction} within group (order by (subquery."result")) as "result"`,
              `COUNT(DISTINCT subquery."userId") as "participantsLogged"`,
            ])
            .addFrom('(' + executeQuery.getQuery() + ')', 'subquery')
            .groupBy(`subquery."${conditionOrLevelId}"`)
            .setParameters(executeQuery.getParameters());
        } else if (operationType === OPERATION_TYPES.STDEV) {
          withinSubjectExecuteQuery = getManager()
            .createQueryBuilder()
            .select([
              `subquery."${conditionOrLevelId}"`,
              `coalesce(${operationType}(subquery."result"),0) as "result"`,
              `COUNT(DISTINCT subquery."userId") as "participantsLogged"`,
            ])
            .addFrom('(' + executeQuery.getQuery() + ')', 'subquery')
            .groupBy(`subquery."${conditionOrLevelId}"`)
            .setParameters(executeQuery.getParameters());
        } else {
          withinSubjectExecuteQuery = getManager()
            .createQueryBuilder()
            .select([
              `subquery."${conditionOrLevelId}"`,
              `${operationType}(subquery."result") as "result"`,
              `COUNT(DISTINCT subquery."userId") as "participantsLogged"`,
            ])
            .addFrom('(' + executeQuery.getQuery() + ')', 'subquery')
            .groupBy(`subquery."${conditionOrLevelId}"`)
            .setParameters(executeQuery.getParameters());
        }
        return withinSubjectExecuteQuery.getRawMany();
      } else {
        return executeQuery.getRawMany();
      }
    }
  }

  private addRepeatedMeasureQuery(
    repeatedMeasure: REPEATED_MEASURE,
    query: any,
    andQuery: any,
    jsonDataValue: string,
    unitOfAssignment: string
  ) {
    let valueToUse;
    switch (repeatedMeasure) {
      case REPEATED_MEASURE.mostRecent:
        this.repeatedMeasureMostRecent(query, andQuery, unitOfAssignment);
        valueToUse = 'extracted.value';
        break;
      case REPEATED_MEASURE.earliest:
        this.repeatedMeasureEarliest(query, andQuery, unitOfAssignment);
        valueToUse = 'extracted.value';
        break;
      default:
        this.repeatedMeasureMean(query, jsonDataValue, andQuery, unitOfAssignment);
        valueToUse = 'avg.avgval';
        break;
    }
    return valueToUse;
  }

  private repeatedMeasureMostRecent(
    query: SelectQueryBuilder<Experiment>,
    andQuery: string,
    unitOfAssignment: string
  ): SelectQueryBuilder<Experiment> {
    if (unitOfAssignment !== 'within-subjects') {
      return query.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('max(sqlog."updatedAt")')
          .from(Log, 'sqlog')
          .where('sqlog."userId" = logs."userId"')
          .andWhere(andQuery)
          .getSql();
        return `logs."updatedAt" = ${subQuery}`;
      });
    } else {
      return query.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('max(sqlog."updatedAt")')
          .from(Log, 'sqlog')
          .innerJoin(MonitoredDecisionPointLog, 'mdpLog', '"mdpLog"."uniquifier" = "sqlog"."uniquifier"')
          .innerJoin(ExperimentCondition, 'expCond', '"expCond"."conditionCode" = "mdpLog"."condition"')
          .where('sqlog."userId" = logs."userId"')
          .andWhere(andQuery)
          .groupBy('"sqlog"."userId", "expCond"."id"')
          .getSql();
        return `logs."updatedAt" IN ${subQuery}`;
      });
    }
  }

  private repeatedMeasureEarliest(
    query: SelectQueryBuilder<Experiment>,
    andQuery: string,
    unitOfAssignment: string
  ): SelectQueryBuilder<Experiment> {
    if (unitOfAssignment !== 'within-subjects') {
      return query.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('min(sqlog."updatedAt")')
          .from(Log, 'sqlog')
          .where('sqlog."userId" = logs."userId"')
          .andWhere(andQuery)
          .getSql();
        return `logs."updatedAt" = ${subQuery}`;
      });
    } else {
      return query.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('min(sqlog."updatedAt")')
          .from(Log, 'sqlog')
          .innerJoin(MonitoredDecisionPointLog, 'mdpLog', '"mdpLog"."uniquifier" = "sqlog"."uniquifier"')
          .innerJoin(ExperimentCondition, 'expCond', '"expCond"."conditionCode" = "mdpLog"."condition"')
          .where('sqlog."userId" = logs."userId"')
          .andWhere(andQuery)
          .groupBy('"sqlog"."userId", "expCond"."id"')
          .getSql();
        return `logs."updatedAt" IN ${subQuery}`;
      });
    }
  }

  private repeatedMeasureMean(
    query: SelectQueryBuilder<Experiment>,
    jsonDataValue: string,
    andQuery: string,
    unitOfAssignment: string
  ): SelectQueryBuilder<Experiment> {
    if (unitOfAssignment !== 'within-subjects') {
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
            .select('min(sqlog."updatedAt")')
            .from(Log, 'sqlog')
            .where('sqlog."userId" = logs."userId"')
            .andWhere(andQuery)
            .getSql();
          return `logs."updatedAt" = ${subQuery}`;
        });
    } else {
      return query
        .innerJoin(
          (qb) => {
            return qb
              .subQuery()
              .select([
                `avg(cast(${jsonDataValue} as decimal)) as avgval`,
                'logs."userId" as "userId", "expCond"."id" as "conditionId"',
              ])
              .from(Log, 'logs')
              .innerJoin(MonitoredDecisionPointLog, 'mdpLog', '"mdpLog"."uniquifier" = "logs"."uniquifier"')
              .innerJoin(ExperimentCondition, 'expCond', '"expCond"."conditionCode" = "mdpLog"."condition"')
              .groupBy('"expCond"."id", logs."userId"');
          },
          'avg',
          'avg."userId" = logs."userId" AND avg."conditionId" = "experimentCondition"."conditionId"'
        )
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('min(sqlog."updatedAt")')
            .from(Log, 'sqlog')
            .innerJoin(MonitoredDecisionPointLog, 'mdpLog', '"mdpLog"."uniquifier" = "sqlog"."uniquifier"')
            .innerJoin(ExperimentCondition, 'expCond', '"expCond"."conditionCode" = "mdpLog"."condition"')
            .where('sqlog."userId" = logs."userId"')
            .andWhere(andQuery)
            .groupBy('"sqlog"."userId", "expCond"."id"')
            .getSql();
          return `logs."updatedAt" IN ${subQuery}`;
        });
    }
  }

  private getCommonAnalyticQuery(
    metric: string,
    experimentId: string,
    queryId: string,
    metricString: string,
    isFactorialExperiment: boolean,
    unitOfAssignment: string
  ): SelectQueryBuilder<Experiment> {
    const experimentRepo = getRepository(Experiment);
    const analyticsQuery = experimentRepo
      .createQueryBuilder('experiment')
      .innerJoin('experiment.queries', 'queries')
      .innerJoin('queries.metric', 'metric')
      .innerJoinAndSelect('metric.logs', 'logs');
  
    if (unitOfAssignment !== 'within-subjects') {
      analyticsQuery
        .innerJoinAndSelect(
          (qb) => qb
            .subQuery()
            .select([
              `"individualEnrollment"."userId" as "userId"`,
              `"individualEnrollment"."experimentId" as "experimentId"`,
              `"individualEnrollment"."conditionId" as "conditionId"`,
            ])
            .distinct()
            .from(IndividualEnrollment, 'individualEnrollment')
        , 'individualEnrollment', 'experiment.id = "individualEnrollment"."experimentId" AND logs."userId" = "individualEnrollment"."userId"')
        .innerJoinAndSelect(
          (qb) => qb
            .subQuery()
            .select([`${metricString} as value`, 'logs.id as id'])
            .from(Log, 'logs')
        , 'extracted', 'extracted.id = logs.id');
    } else {
      analyticsQuery
        .innerJoinAndSelect(
          (qb) => qb
            .subQuery()
            .select([
              `"individualEnrollment"."userId" as "userId"`,
              `"individualEnrollment"."experimentId" as "experimentId"`,
            ])
            .distinct()
            .from(IndividualEnrollment, 'individualEnrollment')
        , 'individualEnrollment', 'experiment.id = "individualEnrollment"."experimentId" AND logs."userId" = "individualEnrollment"."userId"')
        .innerJoinAndSelect(
          (qb) => qb
            .subQuery()
            .select([
              `"monitoredDecisionPoint"."userId" as "userId"`,
              `"monitoredDecisionPoint"."id" as "monitoredDecisionPointId"`,
              `"monitoredDecisionPoint"."experimentId" as "experimentId"`,
            ])
            .distinct()
            .from(MonitoredDecisionPoint, 'monitoredDecisionPoint')
        , 'monitoredDecisionPoint', '"individualEnrollment"."userId" = "monitoredDecisionPoint"."userId" AND "experiment"."id"::text = "monitoredDecisionPoint"."experimentId"')
        .innerJoinAndSelect(
          (qb) => qb
            .subQuery()
            .select([
              `"monitoredDecisionPointLog"."uniquifier" as "uniquifier"`,
              `"monitoredDecisionPointLog"."condition" as "condition"`,
              `"monitoredDecisionPointLog"."monitoredDecisionPointId" as "monitoredDecisionPointId"`,
            ])
            .distinct()
            .from(MonitoredDecisionPointLog, 'monitoredDecisionPointLog')
        , 'monitoredDecisionPointLog', '"monitoredDecisionPoint"."monitoredDecisionPointId" = "monitoredDecisionPointLog"."monitoredDecisionPointId" AND logs."uniquifier" = "monitoredDecisionPointLog"."uniquifier"')
        .innerJoinAndSelect(
          (qb) => qb
            .subQuery()
            .select([
              `"experimentCondition"."conditionCode" as "condition"`,
              `"experimentCondition"."id" as "conditionId"`,
            ])
            .distinct()
            .from(ExperimentCondition, 'experimentCondition')
        , 'experimentCondition', '"monitoredDecisionPointLog"."condition" = "experimentCondition"."condition"')
        .innerJoinAndSelect(
          (qb) => qb
            .subQuery()
            .select([`${metricString} as value`, 'logs.id as id'])
            .from(Log, 'logs')
        , 'extracted', 'extracted.id = logs.id');
    }
  
    if (isFactorialExperiment) {
      const conditionIdCondition = unitOfAssignment !== 'within-subjects' ?
        '"levelCombinationElement"."LCEconditionId" = "individualEnrollment"."conditionId"' :
        '"levelCombinationElement"."LCEconditionId" = "experimentCondition"."conditionId"';
  
      analyticsQuery.innerJoinAndSelect(
        (qb) => qb
          .subQuery()
          .select([
            `"levelCombinationElement"."conditionId" as "LCEconditionId"`,
            `"levelCombinationElement"."levelId" as "levelId"`,
          ])
          .distinct()
          .from(LevelCombinationElement, 'levelCombinationElement')
        , 'levelCombinationElement', conditionIdCondition);
    }
  
    analyticsQuery
      .where('metric.key = :metric', { metric })
      .andWhere('experiment.id = :experimentId', { experimentId })
      .andWhere('queries.id = :queryId', { queryId });
  
    return analyticsQuery;
  }
}
