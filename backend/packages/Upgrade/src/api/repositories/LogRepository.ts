import { Container } from './../../typeorm-typedi-extensions/Container';
import { ExperimentRepository } from './ExperimentRepository';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { Repository, EntityManager, SelectQueryBuilder } from 'typeorm';
import { Log } from '../models/Log';
import repositoryError from './utils/repositoryError';
import { OPERATION_TYPES, IMetricMetaData, REPEATED_MEASURE, EXPERIMENT_TYPE } from 'upgrade_types';
import { METRICS_JOIN_TEXT } from '../services/MetricService';
import { Query } from '../models/Query';
import { LevelCombinationElement } from '../models/LevelCombinationElement';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { QueryRepository } from './QueryRepository';
import { MetricRepository } from './MetricRepository';
import { RepeatedEnrollment } from '../models/RepeatedEnrollment';
import { IndividualEnrollmentRepository } from './IndividualEnrollmentRepository';
import { IndividualEnrollment } from '../models/IndividualEnrollment';

export interface AnalyticsQueryResult {
  conditionId?: string;
  levelId?: string;
  result: number;
  participantsLogged: number;
}
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
    const queryRepo = Container.getCustomRepository(QueryRepository);

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
    const metricsRepository = Container.getCustomRepository(MetricRepository);
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
  public async getLogPerExperimentQuery(experimentId: string): Promise<
    Array<{
      data: Record<string, any>;
      id: string;
      name: string;
      repeatedMeasure: REPEATED_MEASURE;
      userId: string;
      updatedAt: string;
      key: string;
      type: IMetricMetaData;
      uniquifier: string;
    }>
  > {
    const experimentRepo = Container.getCustomRepository(ExperimentRepository, 'export');
    return experimentRepo
      .createQueryBuilder('experiment')
      .select([
        'logs.data as data',
        'queries.id as id',
        'queries.name as name',
        'queries."repeatedMeasure" as "repeatedMeasure"',
        'logs."userId" as "userId"',
        'logs."updatedAt" as "updatedAt"',
        'logs."uniquifier" as "uniquifier"',
        'metric.key as key',
        'metric.type as type',
      ])
      .innerJoin(IndividualEnrollment, 'individualEnrollment', '"individualEnrollment"."experimentId"=experiment.id')
      .innerJoin('experiment.queries', 'queries')
      .innerJoin('queries.metric', 'metric')
      .innerJoin('metric.logs', 'logs', '"logs"."userId"="individualEnrollment"."userId"')
      .where('experiment.id=:experimentId', { experimentId })
      .execute();
  }

  public prepareMetricString(metricId: string[]) {
    let metricString = metricId.reduce((accumulator: string, value: string) => {
      return accumulator !== '' ? `${accumulator} -> '${value}'` : `'${value}'`;
    }, '');
    if (metricId.length > 1) {
      metricString =
        metricString.substring(0, metricString.lastIndexOf('->')) +
        '->>' +
        metricString.substring(metricString.lastIndexOf('->') + 2, metricString.length);
    }
    return metricString;
  }

  private getCategoricalresultSelect(query: any, userDatum: string) {
    const comparator = query.compareFn === '=' ? '=' : '!=';
    const compareTo = query.compareValue || '';
    const count = `count(cast(${userDatum} as text)) filter (where ${userDatum} ${comparator} '${compareTo}')`;
    if (query.operationType === OPERATION_TYPES.PERCENTAGE) {
      return `cast(${count} as decimal) / cast(count(cast(${userDatum} as text)) as decimal) * 100`;
    }
    return count;
  }

  private getContinuousResultSelect(operationType: OPERATION_TYPES, userDatum: string) {
    if (operationType === OPERATION_TYPES.MEDIAN || operationType === OPERATION_TYPES.MODE) {
      const queryFunction = operationType === OPERATION_TYPES.MEDIAN ? 'percentile_cont(0.5)' : 'mode()';
      return `${queryFunction} within group (order by (cast(${userDatum} as decimal)))`;
    }
    return `${operationType}(cast(${userDatum} as decimal))`;
  }

  private getWithinSubjectsAnalyticsQuery(
    experimentId: string,
    operationType: OPERATION_TYPES,
    metricString: string,
    isFactorialExperiment: boolean,
    isCategorical: boolean,
    repeatedMeasure: REPEATED_MEASURE,
    query: any
  ) {
    const individualEnrollmentRepo = Container.getCustomRepository(IndividualEnrollmentRepository, 'export');

    const innerQuery = individualEnrollmentRepo.createQueryBuilder('individualEnrollment');

    const analyticsQuery: SelectQueryBuilder<AnalyticsQueryResult> =
      Container.getDataSource('export').createQueryBuilder();
    const middleQuery = Container.getDataSource('export').createQueryBuilder();

    const idToSelect = isFactorialExperiment ? '"levelId"' : '"conditionId"';
    const valueToSelect = isFactorialExperiment
      ? `"levelCombinationElement".${idToSelect}`
      : '"experimentCondition"."id"';

    const resultSelect = isCategorical
      ? this.getCategoricalresultSelect(query, 'subquery.result')
      : this.getContinuousResultSelect(operationType, 'subquery.result');

    // Select the id of the condition or level, and the resulting aggregate metric value
    analyticsQuery.select([`subquery.${idToSelect}`, `${resultSelect} as result`]);

    innerQuery.select([`${valueToSelect} as ${idToSelect}`, 'logs."userId" as "userId"']);
    if (repeatedMeasure === REPEATED_MEASURE.mean) {
      // If we are calculating the mean, we average the metric value for each user
      innerQuery.addSelect('avg(cast(logs.datum as decimal)) as "result"');
    } else {
      innerQuery.addSelect([
        'logs.datum',
        `row_number() over (partition by logs."userId", ${valueToSelect} order by logs."updatedAt" ${
          repeatedMeasure === REPEATED_MEASURE.mostRecent ? 'DESC' : ''
        }) AS rn`,
        'logs."updatedAt"',
      ]);
    }
    innerQuery
      .innerJoin(
        RepeatedEnrollment,
        'repeatedEnrollment',
        '"repeatedEnrollment"."individualEnrollmentId"="individualEnrollment"."id"'
      )
      .innerJoin(
        (qb) =>
          qb
            .subQuery()
            .select(['"uniquifier"', '"userId"', '"logs"."updatedAt"', `${metricString} as datum`])
            .from(Log, 'logs')
            .where(`${metricString} is not null`),
        'logs',
        'logs."userId"="individualEnrollment"."userId" AND logs."uniquifier" = "repeatedEnrollment"."uniquifier"'
      )
      .innerJoin(
        ExperimentCondition,
        'experimentCondition',
        '"experimentCondition"."id" = "repeatedEnrollment"."conditionId"'
      );

    if (isFactorialExperiment) {
      innerQuery.innerJoin(
        (qb) =>
          qb
            .subQuery()
            .select(['"levelCombinationElement"."levelId"', '"levelCombinationElement"."conditionId"'])
            .distinct()
            .from(LevelCombinationElement, 'levelCombinationElement'),
        'levelCombinationElement',
        '"levelCombinationElement"."conditionId"="experimentCondition"."id"'
      );
    }
    innerQuery
      .where(`"individualEnrollment"."experimentId" = '${experimentId}'`)
      .groupBy(`${valueToSelect}, logs."userId"`);
    if (repeatedMeasure !== REPEATED_MEASURE.mean) {
      innerQuery.addGroupBy('logs."updatedAt", logs.datum');
    }
    // Select the number of participants (n) who have logged a value for the metric
    analyticsQuery.addSelect('COUNT(DISTINCT subquery."userId") as "participantsLogged"');

    if (repeatedMeasure !== REPEATED_MEASURE.mean) {
      // If we are using most recent or earliest, we create a subquery to rank the logs by date
      middleQuery
        .select([idToSelect, ' datum as result', '"userId"'])
        .addFrom('(' + innerQuery.getQuery() + ')', 't')
        .where('rn = 1');
      analyticsQuery.addFrom('(' + middleQuery.getQuery() + ')', 'subquery').groupBy(`subquery.${idToSelect}`);
    } else {
      analyticsQuery.addFrom('(' + innerQuery.getQuery() + ')', 'subquery').groupBy(`subquery.${idToSelect}`);
    }
    return analyticsQuery;
  }

  private getStandardAnalyticsQuery(
    experimentId: string,
    operationType: OPERATION_TYPES,
    metricString: string,
    isFactorialExperiment: boolean,
    isCategorical: boolean,
    repeatedMeasure: REPEATED_MEASURE,
    query: any
  ) {
    const individualEnrollmentRepo = Container.getCustomRepository(IndividualEnrollmentRepository, 'export');

    // Build the base query with the eventual custom type from added selects
    const analyticsQuery = individualEnrollmentRepo.createQueryBuilder(
      'individualEnrollment'
    ) as unknown as SelectQueryBuilder<AnalyticsQueryResult>;

    const idToSelect = isFactorialExperiment
      ? '"levelCombinationElement"."levelId"'
      : '"individualEnrollment"."conditionId"';
    const resultSelect = isCategorical
      ? this.getCategoricalresultSelect(query, 'logs.datum')
      : this.getContinuousResultSelect(operationType, 'logs.datum');

    // Select the id of the condition or level, and the resulting aggregate metric value
    analyticsQuery.select([idToSelect, `${resultSelect} as result`]);
    // Select the number of participants (n) who have logged a value for the metric
    analyticsQuery.addSelect('COUNT(DISTINCT "individualEnrollment"."userId") as "participantsLogged"');
    if (isFactorialExperiment) {
      analyticsQuery.innerJoin(
        (qb) =>
          qb
            .subQuery()
            .select(['"levelCombinationElement"."levelId"', '"levelCombinationElement"."conditionId"'])
            .distinct()
            .from(LevelCombinationElement, 'levelCombinationElement'),
        'levelCombinationElement',
        '"levelCombinationElement"."conditionId"="individualEnrollment"."conditionId"'
      );
    }
    if (repeatedMeasure === REPEATED_MEASURE.mean) {
      // If we are calculating the mean, we average the metric value for each user
      analyticsQuery.innerJoin(
        (qb) =>
          qb
            .subQuery()
            .select([`"userId", avg(cast(${metricString} as decimal)) AS "datum"`])
            .from(Log, 'logs')
            .where(`${metricString} is not null`)
            .groupBy('"userId"'),
        'logs',
        'logs."userId"="individualEnrollment"."userId"'
      );
    } else {
      // If we are using most recent or earliest, we create a subquery to rank the logs by date
      analyticsQuery.innerJoin(
        (qb) =>
          qb
            .subQuery()
            .select([`"userId", "datum"`])
            .from((subQuery) => {
              return subQuery
                .select([
                  '"userId"',
                  `${metricString} as "datum"`,
                  `row_number() over (partition by "userId" order by "updatedAt" ${
                    repeatedMeasure === REPEATED_MEASURE.mostRecent ? 'DESC' : ''
                  }) AS rn`,
                ])
                .from(Log, 'logs')
                .where(`${metricString} is not null`);
            }, 't')
            .where('rn = 1'),
        'logs',
        'logs."userId"="individualEnrollment"."userId"'
      );
    }

    analyticsQuery.where('"experimentId" = :experimentId', { experimentId }).groupBy(idToSelect);

    return analyticsQuery;
  }

  public async analysis(query: Query) {
    const {
      metric: { key: metricKey, type: metricType },
      experiment: { id: experimentId, assignmentUnit: unitOfAssignment, type: experimentType },
      query: { operationType },
      repeatedMeasure,
    } = query;
    const metricId = metricKey.split(METRICS_JOIN_TEXT);
    const isFactorialExperiment = experimentType === EXPERIMENT_TYPE.FACTORIAL;
    const isContinuousMetric = metricType === 'continuous';
    const metricString = this.prepareMetricString(metricId);
    const jsonDataValueLog = metricId.length <= 1 ? `logs.data ->> ${metricString}` : `logs.data -> ${metricString}`;

    const newQuery =
      unitOfAssignment !== 'within-subjects'
        ? this.getStandardAnalyticsQuery(
            experimentId,
            operationType,
            jsonDataValueLog,
            isFactorialExperiment,
            !isContinuousMetric,
            repeatedMeasure,
            query.query
          )
        : this.getWithinSubjectsAnalyticsQuery(
            experimentId,
            operationType,
            jsonDataValueLog,
            isFactorialExperiment,
            !isContinuousMetric,
            repeatedMeasure,
            query.query
          );

    return newQuery.getRawMany<AnalyticsQueryResult>();
  }
}
