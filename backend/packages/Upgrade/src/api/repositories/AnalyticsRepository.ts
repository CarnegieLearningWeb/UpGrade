import { Experiment } from '../models/Experiment';
import { IndividualExclusionRepository } from './IndividualExclusionRepository';
import { IndividualEnrollmentRepository } from './IndividualEnrollmentRepository';
import { Container, EntityRepository } from '../../typeorm-typedi-extensions';
import { ExperimentRepository } from './ExperimentRepository';
import { PreviewUser } from '../models/PreviewUser';
import {
  DATE_RANGE,
  IExperimentEnrollmentStats,
  ASSIGNMENT_UNIT,
  IExperimentEnrollmentDetailStats,
} from 'upgrade_types';
import { GroupEnrollmentRepository } from './GroupEnrollmentRepository';
import { GroupEnrollment } from '../models/GroupEnrollment';
import { GroupExclusionRepository } from './GroupExclusionRepository';
import { DecisionPoint } from '../models/DecisionPoint';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { UserStratificationFactorRepository } from './UserStratificationRepository';
import _ from 'lodash';
import { Repository } from 'typeorm';
import { RepeatedEnrollment } from '../models/RepeatedEnrollment';

export interface IEnrollmentByCondition {
  conditions_id: string;
  count: string;
}

export interface IEnrollmentConditionAndPartition {
  conditions_id: string;
  partitions_id: string;
  count: string;
}

export interface IExcluded {
  count: string;
}

export interface IEnrollmentByConditionDate {
  conditions_id: string;
  count: string;
  date_range: string;
}

export interface IEnrollmentConditionAndPartitionDate {
  conditionId: string;
  partitionId: string;
  count: number;
  date_range: string;
}

export interface CSVExportDataRow {
  experimentId: string;
  experimentName: string;
  userId: string;
  partition: string;
  conditionName: string;
  markExperimentPointTime: string;
  context: string[];
  assignmentUnit: string;
  group: string;
  consistencyRule: string;
  designType: string;
  algorithmType: string;
  stratification: string;
  stratificationValue: string;
  site: string;
  target: string;
  excludeIfReached: string;
  payload: string;
  postRule: string;
  revertTo: string;
  enrollmentStartDate: string;
  enrollmentCompleteDate: string;
  enrollmentGroupId: string;
  enrollmentCode: string;
}

export interface ConditionDecisionPointData {
  revertTo?: string;
  payload?: string;
  excludeIfReached?: boolean;
  expDecisionPointId?: string;
  expConditionId?: string;
  conditionName?: string;
}

export interface ExperimentDetailsForCSVData extends ConditionDecisionPointData {
  experimentId: string;
  experimentName: string;
  context: string[];
  assignmentUnit: string;
  group: string;
  consistencyRule: string;
  designType: string;
  algorithmType: string;
  stratification: string;
  postRule: string;
  enrollmentStartDate: string;
  enrollmentCompleteDate: string;
  details: ConditionDecisionPointData[];
}

@EntityRepository()
export class AnalyticsRepository extends Repository<AnalyticsRepository> {
  public async getEnrollmentCountPerGroup(experimentId: string): Promise<Array<{ groupId: string; count: number }>> {
    const individualEnrollmentRepository = Container.getCustomRepository(IndividualEnrollmentRepository);
    return individualEnrollmentRepository
      .createQueryBuilder('individualEnrollment')
      .select([
        'COUNT(DISTINCT("individualEnrollment"."userId"))::int as count',
        `"individualEnrollment"."groupId" as "groupId"`,
      ])
      .where('"individualEnrollment"."experimentId" = :experimentId', { experimentId })
      .innerJoin(GroupEnrollment, 'groupEnrollment', '"groupEnrollment"."groupId" = "individualEnrollment"."groupId"')
      .groupBy('"individualEnrollment"."groupId"')
      .execute();
  }

  public async getEnrollmentPerPartitionCondition(experimentId: string): Promise<IExperimentEnrollmentDetailStats> {
    const experimentRepository = Container.getCustomRepository(ExperimentRepository);
    const individualEnrollmentRepository = Container.getCustomRepository(IndividualEnrollmentRepository);
    const individualExclusionRepository = Container.getCustomRepository(IndividualExclusionRepository);
    const groupExclusionRepository = Container.getCustomRepository(GroupExclusionRepository);

    // find experiment data
    const experiment = await experimentRepository.findOne({
      where: { id: experimentId },
      relations: ['partitions', 'conditions'],
    });

    if (experiment && experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL) {
      const [includedUser, usersPerCondition, perConditionDecisionPoint, excludedUser]: [
        [{ count: number }],
        Array<{ id: string; conditionId: string; count: number }>,
        Array<{ id: string; partitionId: string; conditionId: string; count: number }>,
        [{ count: number }]
      ] = await Promise.all([
        individualEnrollmentRepository
          .createQueryBuilder('individualEnrollment')
          .select('COUNT(DISTINCT("userId"))::int as count')
          .where('"individualEnrollment"."experimentId" = :experimentId', { experimentId })
          .execute(),
        individualEnrollmentRepository
          .createQueryBuilder('individualEnrollment')
          .select([
            '"individualEnrollment"."experimentId" as id',
            '"conditionId"',
            'COUNT(DISTINCT("userId"))::int as count',
          ])
          .where('"individualEnrollment"."experimentId" = :experimentId', { experimentId })
          .groupBy('"individualEnrollment"."experimentId"')
          .addGroupBy('"conditionId"')
          .execute(),
        individualEnrollmentRepository
          .createQueryBuilder('individualEnrollment')
          .select([
            '"individualEnrollment"."experimentId" as id',
            '"partitionId"',
            '"conditionId"',
            'COUNT(DISTINCT("userId"))::int as count',
          ])
          .where('"individualEnrollment"."experimentId" = :experimentId', { experimentId })
          .groupBy('"partitionId"')
          .addGroupBy('"conditionId"')
          .addGroupBy('"individualEnrollment"."experimentId"')
          .execute(),
        individualExclusionRepository
          .createQueryBuilder('individualExclusion')
          .select('COUNT(DISTINCT("userId"))::int as count')
          .where('"individualExclusion"."experimentId" = :experimentId', { experimentId })
          .execute(),
      ]);

      // organize data here
      return {
        id: experimentId,
        users: includedUser[0].count,
        groups: 0,
        usersExcluded: excludedUser[0].count,
        groupsExcluded: 0,
        conditions: experiment.conditions.map(({ id: conditionId }) => {
          const conditionData: { id: string; conditionId: string; count: number } | undefined = usersPerCondition.find(
            (perCondition) => perCondition.conditionId === conditionId
          );
          return {
            id: conditionId,
            users: conditionData?.count || 0,
            groups: 0,
            partitions: experiment.partitions.map(({ id: decisionPointId }) => {
              const decisionPointData:
                | { id: string; partitionId: string; conditionId: string; count: number }
                | undefined = perConditionDecisionPoint.find((perDecisionPoint) => {
                return perDecisionPoint.conditionId === conditionId && perDecisionPoint.partitionId === decisionPointId;
              });

              return {
                id: decisionPointId,
                users: decisionPointData?.count || 0,
                groups: 0,
              };
            }),
          };
        }),
      };
    } else if (experiment && experiment.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS) {
      const [includedUser, usersPerCondition, perConditionDecisionPoint, excludedUser]: [
        [{ count: number }],
        Array<{ id: string; conditionId: string; count: number }>,
        Array<{ id: string; partitionId: string; conditionId: string; count: number }>,
        [{ count: number }]
      ] = await Promise.all([
        individualEnrollmentRepository
          .createQueryBuilder('individualEnrollment')
          .select('COUNT(DISTINCT("userId"))::int as count')
          .where('"individualEnrollment"."experimentId" = :experimentId', { experimentId })
          .execute(),
        individualEnrollmentRepository
          .createQueryBuilder('individualEnrollment')
          .select([
            '"individualEnrollment"."experimentId" as id',
            '"expCond"."id" as "conditionId"',
            'COUNT(DISTINCT("individualEnrollment"."userId"))::int as count',
          ])
          .leftJoin(RepeatedEnrollment, 'repeated', 'individualEnrollment.id = repeated.individualEnrollmentId')
          .leftJoin(ExperimentCondition, 'expCond', 'expCond.id = repeated.conditionId')
          .groupBy('"individualEnrollment"."experimentId"')
          .addGroupBy('expCond.id')
          .execute(),
        individualEnrollmentRepository
          .createQueryBuilder('individualEnrollment')
          .select([
            '"individualEnrollment"."experimentId" as id',
            '"dp"."id" as "partitionId"',
            '"expCond"."id" as "conditionId"',
            'COUNT(DISTINCT("individualEnrollment"."userId"))::int as count',
          ])
          .leftJoin(DecisionPoint, 'dp', 'dp.id = individualEnrollment.partitionId')
          .where('"individualEnrollment"."experimentId" = :experimentId', { experimentId })
          .leftJoin(RepeatedEnrollment, 'repeated', 'individualEnrollment.id = repeated.individualEnrollmentId')
          .leftJoin(ExperimentCondition, 'expCond', 'expCond.id = repeated.conditionId')
          .groupBy('"dp"."id"')
          .addGroupBy('"expCond"."id"')
          .addGroupBy('"individualEnrollment"."experimentId"')
          .execute(),
        individualExclusionRepository
          .createQueryBuilder('individualExclusion')
          .select('COUNT(DISTINCT("userId"))::int as count')
          .where('"individualExclusion"."experimentId" = :experimentId', { experimentId })
          .execute(),
      ]);

      // organize data here
      return {
        id: experimentId,
        users: includedUser[0].count,
        groups: 0,
        usersExcluded: excludedUser[0].count,
        groupsExcluded: 0,
        conditions: experiment.conditions.map(({ id: conditionId }) => {
          const conditionData: { id: string; conditionId: string; count: number } | undefined = usersPerCondition.find(
            (perCondition) => perCondition.conditionId === conditionId
          );
          return {
            id: conditionId,
            users: conditionData?.count || 0,
            groups: 0,
            partitions: experiment.partitions.map(({ id: decisionPointId }) => {
              const decisionPointData:
                | { id: string; partitionId: string; conditionId: string; count: number }
                | undefined = perConditionDecisionPoint.find((perDecisionPoint) => {
                return perDecisionPoint.conditionId === conditionId && perDecisionPoint.partitionId === decisionPointId;
              });

              return {
                id: decisionPointId,
                users: decisionPointData?.count || 0,
                groups: 0,
              };
            }),
          };
        }),
      };
    } else {
      const [includedUser, perCondition, perConditionDecisionPoint, excludedUser, excludedGroup]: [
        [{ userCount: number; groupCount: number }],
        Array<{ id: string; conditionId: string; userCount: number; groupCount: number }>,
        Array<{ id: string; conditionId: string; partitionId: string; userCount: number; groupCount: number }>,
        [{ count: number }],
        [{ count: number }]
      ] = await Promise.all([
        individualEnrollmentRepository
          .createQueryBuilder('individualEnrollment')
          .select([
            'COUNT(DISTINCT("userId"))::int as "userCount"',
            'COUNT(DISTINCT("individualEnrollment"."groupId"))::int as "groupCount"',
          ])
          .where('"individualEnrollment"."experimentId" = :experimentId', { experimentId })
          .innerJoin(
            GroupEnrollment,
            'groupEnrollment',
            '"groupEnrollment"."groupId" = "individualEnrollment"."groupId"'
          )
          .execute(),
        individualEnrollmentRepository
          .createQueryBuilder('individualEnrollment')
          .select([
            '"individualEnrollment"."experimentId" as id',
            '"individualEnrollment"."conditionId"',
            'COUNT(DISTINCT("userId"))::int as "userCount"',
            'COUNT(DISTINCT("individualEnrollment"."groupId"))::int as "groupCount"',
          ])
          .where('"individualEnrollment"."experimentId" = :experimentId', { experimentId })
          .innerJoin(
            GroupEnrollment,
            'groupEnrollment',
            '"groupEnrollment"."groupId" = "individualEnrollment"."groupId"'
          )
          .groupBy('"individualEnrollment"."experimentId"')
          .addGroupBy('"individualEnrollment"."conditionId"')
          .execute(),
        individualEnrollmentRepository
          .createQueryBuilder('individualEnrollment')
          .select([
            '"individualEnrollment"."experimentId" as id',
            '"individualEnrollment"."conditionId"',
            '"individualEnrollment"."partitionId"',
            'COUNT(DISTINCT("userId"))::int as "userCount"',
            'COUNT(DISTINCT("individualEnrollment"."groupId"))::int as "groupCount"',
          ])
          .where('"individualEnrollment"."experimentId" = :experimentId', { experimentId })
          .innerJoin(
            GroupEnrollment,
            'groupEnrollment',
            '"groupEnrollment"."groupId" = "individualEnrollment"."groupId"'
          )
          .groupBy('"individualEnrollment"."experimentId"')
          .addGroupBy('"individualEnrollment"."conditionId"')
          .addGroupBy('"individualEnrollment"."partitionId"')
          .execute(),
        individualExclusionRepository
          .createQueryBuilder('individualExclusion')
          .select('COUNT(DISTINCT("userId"))::int as count')
          .where('"individualExclusion"."experimentId" = :experimentId', { experimentId })
          .execute(),
        groupExclusionRepository
          .createQueryBuilder('groupExclusion')
          .select('COUNT(DISTINCT("groupId"))::int as count')
          .where('"groupExclusion"."experimentId" = :experimentId', { experimentId })
          .execute(),
      ]);

      return {
        id: experimentId,
        users: includedUser[0].userCount,
        groups: includedUser[0].groupCount,
        usersExcluded: excludedUser[0].count,
        groupsExcluded: excludedGroup[0].count,
        conditions: experiment.conditions.map(({ id: conditionId }) => {
          const conditionData: { id: string; conditionId: string; userCount: number; groupCount: number } | undefined =
            perCondition.find((perCond) => perCond.conditionId === conditionId);
          return {
            id: conditionId,
            users: conditionData?.userCount || 0,
            groups: conditionData?.groupCount || 0,
            partitions: experiment.partitions.map(({ id: decisionPointId }) => {
              const decisionPointData:
                | { id: string; conditionId: string; partitionId: string; userCount: number; groupCount: number }
                | undefined = perConditionDecisionPoint.find((perDecisionPoint) => {
                return perDecisionPoint.conditionId === conditionId && perDecisionPoint.partitionId === decisionPointId;
              });

              return {
                id: decisionPointId,
                users: decisionPointData?.userCount || 0,
                groups: decisionPointData?.groupCount || 0,
              };
            }),
          };
        }),
      };
    }
  }

  public async getEnrollments(experimentIds: string[]): Promise<IExperimentEnrollmentStats[]> {
    if (!experimentIds.length) {
      return [];
    }
    const individualEnrollmentRepository = Container.getCustomRepository(IndividualEnrollmentRepository);
    const groupEnrollmentRepository = Container.getCustomRepository(GroupEnrollmentRepository);

    const [individualEnrollmentPerExperiment, groupEnrollmentPerExperiment]: [
      Array<{ id: string; users: string }>,
      Array<{ id: string; groups: string }>
    ] = await Promise.all([
      individualEnrollmentRepository
        .createQueryBuilder('individualEnrollment')
        .select([
          '"individualEnrollment"."experimentId" as id',
          'COUNT(DISTINCT("individualEnrollment"."userId")) as users',
        ])
        .groupBy('"individualEnrollment"."experimentId"')
        .where('individualEnrollment.experimentId IN (:...ids)', { ids: experimentIds })
        .andWhere((qb) => {
          const subQuery = qb.subQuery().select('user.id').from(PreviewUser, 'user').getQuery();
          return '"individualEnrollment"."userId" NOT IN ' + subQuery;
        })
        .execute(),
      groupEnrollmentRepository
        .createQueryBuilder('groupEnrollment')
        .select(['"groupEnrollment"."experimentId" as id', 'COUNT(DISTINCT("groupEnrollment"."groupId")) as groups'])
        .groupBy('"groupEnrollment"."experimentId"')
        .where('groupEnrollment.experimentId IN (:...ids)', { ids: experimentIds })
        .execute(),
    ]);

    const result = experimentIds.map((id) => {
      const userObject = individualEnrollmentPerExperiment.find(
        (experimentEnrollment) => experimentEnrollment.id === id
      );
      const groupObject = groupEnrollmentPerExperiment.find((experimentEnrollment) => experimentEnrollment.id === id);
      return {
        id,
        users: userObject?.users ? parseInt(userObject.users, 10) : 0,
        groups: groupObject?.groups ? parseInt(groupObject.groups, 10) : 0,
      };
    });

    return result;
  }

  public async getCSVDataForSimpleExport(
    experimentsData: ExperimentDetailsForCSVData,
    experimentId: string
  ): Promise<CSVExportDataRow[]> {
    // Get the individual enrollment-related data
    const individualEnrollmentRepository = Container.getCustomRepository(IndividualEnrollmentRepository, 'export');
    const individualEnrollmentQuery = individualEnrollmentRepository
      .createQueryBuilder('individualEnrollment')
      .select([
        '"individualEnrollment"."userId" as "userId"',
        '"individualEnrollment"."createdAt" as "createdAt"',
        '"individualEnrollment"."groupId" as "enrollmentGroupId"',
        '"individualEnrollment"."enrollmentCode" as "enrollmentCode"',
        '"individualEnrollment"."experimentId" as "experimentId"',
        '"individualEnrollment"."conditionId" as "conditionId"',
        '"individualEnrollment"."partitionId" as "partitionId"',
        '"decisionPointData"."site" as "site"',
        '"decisionPointData"."target" as "target"',
      ])
      .leftJoin(
        DecisionPoint,
        'decisionPointData',
        'decisionPointData.experimentId = individualEnrollment.experimentId AND decisionPointData.id = individualEnrollment.partitionId'
      )
      .groupBy('individualEnrollment.userId')
      .addGroupBy('individualEnrollment.groupId')
      .addGroupBy('individualEnrollment.enrollmentCode')
      .addGroupBy('individualEnrollment.experimentId')
      .addGroupBy('individualEnrollment.conditionId')
      .addGroupBy('individualEnrollment.partitionId')
      .addGroupBy('individualEnrollment.createdAt')
      .addGroupBy('decisionPointData.site')
      .addGroupBy('decisionPointData.target')
      .orderBy('individualEnrollment.userId', 'ASC')
      .where('individualEnrollment.experimentId = :experimentId::uuid', { experimentId });

    const individualEnrollmentQueryResults = await individualEnrollmentQuery.getRawMany();
    const userStratificationFactorUserList = [];

    const individualEnrollmentExperimentData = [];
    individualEnrollmentQueryResults.forEach((individualEnrollmentQueryResult) => {
      experimentsData.details.forEach((detail) => {
        const modifiedExperiments = [];
        if (
          detail.expDecisionPointId === individualEnrollmentQueryResult.partitionId &&
          detail.expConditionId === individualEnrollmentQueryResult.conditionId
        ) {
          // prepare users list that have SRS experiment:
          if (experimentsData.stratification) {
            userStratificationFactorUserList.push(individualEnrollmentQueryResult.userId);
          }
          const { details, ...baseProperties } = experimentsData;

          modifiedExperiments.push({ ...baseProperties, ...detail });
          individualEnrollmentExperimentData.push({
            ...modifiedExperiments[0],
            userId: individualEnrollmentQueryResult.userId,
            groupId: individualEnrollmentQueryResult.enrollmentGroupId,
            enrollmentCode: individualEnrollmentQueryResult.enrollmentCode,
            expDecisionPointId: individualEnrollmentQueryResult.partitionId,
            expConditionId: individualEnrollmentQueryResult.conditionId,
            site: individualEnrollmentQueryResult.site,
            target: individualEnrollmentQueryResult.target,
            markExperimentPointTime: individualEnrollmentQueryResult.createdAt,
          });
        }
      });
    });

    let userStratificationFactorQueryResult = [];
    if (experimentsData.stratification) {
      // get users stratification factor values:
      const userStratificationFactorRepository = Container.getCustomRepository(
        UserStratificationFactorRepository,
        'export'
      );

      const userStratificationFactorQuery = userStratificationFactorRepository
        .createQueryBuilder('userStratificationFactor')
        .select([
          'userStratificationFactor.user as "userId"',
          'userStratificationFactor.stratificationFactorValue as "stratificationFactorValue"',
        ])
        .where('userStratificationFactor.user IN (:...userIds)', {
          userIds: userStratificationFactorUserList.map((data) => data),
        });

      userStratificationFactorQueryResult = await userStratificationFactorQuery.getRawMany();
    }

    return individualEnrollmentExperimentData.map((individualEnrollmentExperiment) => ({
      ...individualEnrollmentExperiment,
      enrollmentGroupId: individualEnrollmentExperiment.groupId,
      stratificationValue: experimentsData.stratification
        ? userStratificationFactorQueryResult.find((user) => user.userId === individualEnrollmentExperiment.userId)
            ?.stratificationFactorValue
        : null,
    }));
  }

  public async getCSVDataForWithInSubExport(experimentId: string): Promise<CSVExportDataRow[]> {
    const individualEnrollmentRepository = Container.getCustomRepository(IndividualEnrollmentRepository, 'export');
    return individualEnrollmentRepository
      .createQueryBuilder('individualEnrollment')
      .select([
        'experiment.id as "experimentId"',
        'experiment.name as "experimentName"',
        'experiment.context as "context"',
        'experiment.assignmentUnit as "assignmentUnit"',
        'experiment.group as "group"',
        '"decisionPoint".site as "site"',
        '"decisionPoint".target as "target"',
        '"individualEnrollment"."userId" as "userId"',
        '"individualEnrollment"."partitionId" as "decisionPointId"',
        '"individualEnrollment"."groupId" as "groupId"',
        '"condition"."conditionCode" as "conditionName"',
        'MIN("repeatedEnrollment"."createdAt") as "firstDecisionPointReachedOn"',
        'CAST(COUNT("repeatedEnrollment"."id") as int) as "decisionPointReachedCount"',
      ])
      .innerJoin(Experiment, 'experiment', 'experiment.id = "individualEnrollment"."experimentId"')
      .leftJoin('individualEnrollment.partition', 'decisionPoint')
      .innerJoin(
        RepeatedEnrollment,
        'repeatedEnrollment',
        '"repeatedEnrollment"."individualEnrollmentId" = "individualEnrollment".id'
      )
      .leftJoin(ExperimentCondition, 'condition', '"condition"."id" = "repeatedEnrollment"."conditionId"')
      .groupBy('experiment.id')
      .addGroupBy('experiment.name')
      .addGroupBy('"decisionPoint"."site"')
      .addGroupBy('"decisionPoint"."target"')
      .addGroupBy('"individualEnrollment"."userId"')
      .addGroupBy('"individualEnrollment"."partitionId"')
      .addGroupBy('"individualEnrollment"."groupId"')
      .addGroupBy('"condition"."conditionCode"')
      .orderBy('"individualEnrollment"."userId"', 'ASC')
      .where('"individualEnrollment"."experimentId" = :experimentId::uuid', { experimentId })
      .execute();
  }

  public async getEnrollmentByDateRange(
    experimentId: string,
    dateRange: DATE_RANGE,
    clientOffset: number
  ): Promise<[IEnrollmentConditionAndPartitionDate[], IEnrollmentConditionAndPartitionDate[]]> {
    const experimentRepository = Container.getCustomRepository(ExperimentRepository);
    const individualEnrollmentRepository = Container.getCustomRepository(IndividualEnrollmentRepository);
    const groupEnrollmentRepository = Container.getCustomRepository(GroupEnrollmentRepository);

    const groupByRange = `date_range`;
    const { whereDate: individualWhereDate, selectRange: individualSelectRange } = this.getDateVariables(
      dateRange,
      clientOffset,
      'individualEnrollment'
    );

    const experiment = await experimentRepository.findOneBy({ id: experimentId });
    let individualEnrollmentConditionAndDecisionPoint: Promise<any>;
    if (experiment && experiment.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS) {
      individualEnrollmentConditionAndDecisionPoint = individualEnrollmentRepository
        .createQueryBuilder('individualEnrollment')
        .select([
          'count(distinct("individualEnrollment"."userId"))::int',
          '"expCond"."id" as "conditionId"',
          '"individualEnrollment"."partitionId"',
          individualSelectRange,
        ])
        .leftJoin(DecisionPoint, 'dp', 'dp.id = individualEnrollment.partitionId')
        .where('"individualEnrollment"."experimentId" = :id', { id: experimentId })
        .andWhere(individualWhereDate)
        .andWhere((qb) => {
          const subQuery = qb.subQuery().select('user.id').from(PreviewUser, 'user').getQuery();
          return '"individualEnrollment"."userId" NOT IN ' + subQuery;
        })
        .leftJoin(RepeatedEnrollment, 'repeated', 'individualEnrollment.id = repeated.individualEnrollmentId')
        .leftJoin(ExperimentCondition, 'expCond', 'expCond.id = repeated.conditionId')
        .groupBy('"expCond"."id"')
        .addGroupBy('"individualEnrollment"."partitionId"')
        .addGroupBy(groupByRange)
        .execute();
    } else {
      individualEnrollmentConditionAndDecisionPoint = individualEnrollmentRepository
        .createQueryBuilder('individualEnrollment')
        .select([
          'count(distinct("individualEnrollment"."userId"))::int',
          '"individualEnrollment"."conditionId"',
          '"individualEnrollment"."partitionId"',
          individualSelectRange,
        ])
        .where('"individualEnrollment"."experimentId" = :id', { id: experimentId })
        .andWhere(individualWhereDate)
        .andWhere((qb) => {
          const subQuery = qb.subQuery().select('user.id').from(PreviewUser, 'user').getQuery();
          return '"individualEnrollment"."userId" NOT IN ' + subQuery;
        })
        .groupBy('"individualEnrollment"."conditionId"')
        .addGroupBy('"individualEnrollment"."partitionId"')
        .addGroupBy(groupByRange)
        .execute();
    }

    const { whereDate: groupWhereDate, selectRange: groupSelectRange } = this.getDateVariables(
      dateRange,
      clientOffset,
      'groupEnrollment'
    );
    const groupEnrollmentConditionAndDecisionPoint = groupEnrollmentRepository
      .createQueryBuilder('groupEnrollment')
      .select([
        'count(distinct("groupEnrollment"."groupId"))::int',
        '"groupEnrollment"."conditionId"',
        '"groupEnrollment"."partitionId"',
        groupSelectRange,
      ])
      .where('"groupEnrollment"."experimentId" = :id', { id: experimentId })
      .andWhere(groupWhereDate)
      .groupBy('"groupEnrollment"."conditionId"')
      .addGroupBy('"groupEnrollment"."partitionId"')
      .addGroupBy(groupByRange)
      .execute();

    return Promise.all([individualEnrollmentConditionAndDecisionPoint, groupEnrollmentConditionAndDecisionPoint]);
  }

  private getDateVariables(
    dateRange: DATE_RANGE,
    clientOffset: number,
    tableName: string
  ): { whereDate: string; selectRange: string } {
    let whereDate = '';
    let selectRange = '';
    switch (dateRange) {
      case DATE_RANGE.LAST_SEVEN_DAYS:
        whereDate = `"${tableName}"."createdAt" > current_date - interval '7 days'`;
        selectRange =
          `date_trunc('day', "${tableName}"."createdAt"::timestamptz at time zone 'UTC'
      + interval '` +
          clientOffset +
          ` minutes') AS date_range`;
        break;
      case DATE_RANGE.LAST_THREE_MONTHS:
        whereDate = `"${tableName}"."createdAt" > current_date - interval '3 months'`;
        selectRange =
          `date_trunc('month', "${tableName}"."createdAt"::timestamptz at time zone 'UTC'
      + interval '` +
          clientOffset +
          ` minutes') AS date_range`;
        break;
      case DATE_RANGE.LAST_SIX_MONTHS:
        whereDate = `"${tableName}"."createdAt" > current_date - interval '6 months'`;
        selectRange =
          `date_trunc('month', "${tableName}"."createdAt"::timestamptz at time zone 'UTC'
      + interval '` +
          clientOffset +
          ` minutes') AS date_range`;
        break;
      default:
        whereDate = `"${tableName}"."createdAt" > current_date - interval '12 months'`;
        selectRange =
          `date_trunc('month', "${tableName}"."createdAt"::timestamptz at time zone 'UTC'
      + interval '` +
          clientOffset +
          ` minutes') AS date_range`;
        break;
    }
    return { whereDate, selectRange };
  }
}
