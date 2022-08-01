import { MonitoredDecisionPoint } from './../models/MonitoredDecisionPoint';
import { Experiment } from '../models/Experiment';
import { IndividualExclusionRepository } from './IndividualExclusionRepository';
import { IndividualEnrollmentRepository } from './IndividualEnrollmentRepository';
import { EntityRepository, EntityManager, getCustomRepository } from 'typeorm';
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

@EntityRepository()
export class AnalyticsRepository {
  constructor(private manager: EntityManager) {}

  public async getEnrollmentCountPerGroup(experimentId: string): Promise<Array<{ groupId: string; count: number }>> {
    const individualEnrollmentRepository = this.manager.getCustomRepository(IndividualEnrollmentRepository);
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
    const experimentRepository = this.manager.getCustomRepository(ExperimentRepository);
    const individualEnrollmentRepository = this.manager.getCustomRepository(IndividualEnrollmentRepository);
    const individualExclusionRepository = this.manager.getCustomRepository(IndividualExclusionRepository);
    // const groupEnrollmentRepository = this.manager.getCustomRepository(GroupEnrollmentRepository);
    const groupExclusionRepository = this.manager.getCustomRepository(GroupExclusionRepository);

    // find experiment data
    const experiment = await experimentRepository.findOne(experimentId, { relations: ['partitions', 'conditions'] });
    if (experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL) {
      const [includedUser, usersPerCondition, perConditionPartition, excludedUser]: [
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
            partitions: experiment.partitions.map(({ id: partitionId }) => {
              const partitionData: { id: string; partitionId: string; conditionId: string; count: number } | undefined =
                perConditionPartition.find((perPartition) => {
                  return perPartition.conditionId === conditionId && perPartition.partitionId === partitionId;
                });

              return {
                id: partitionId,
                users: partitionData?.count || 0,
                groups: 0,
              };
            }),
          };
        }),
      };
    } else {
      const [includedUser, perCondition, perConditionPartition, excludedUser, excludedGroup]: [
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
            partitions: experiment.partitions.map(({ id: partitionId }) => {
              const partitionData:
                | { id: string; conditionId: string; partitionId: string; userCount: number; groupCount: number }
                | undefined = perConditionPartition.find((perPartition) => {
                return perPartition.conditionId === conditionId && perPartition.partitionId === partitionId;
              });

              return {
                id: partitionId,
                users: partitionData?.userCount || 0,
                groups: partitionData?.groupCount || 0,
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
    const individualEnrollmentRepository = this.manager.getCustomRepository(IndividualEnrollmentRepository);
    const groupEnrollmentRepository = this.manager.getCustomRepository(GroupEnrollmentRepository);

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
    experimentId: string,
    skip: number,
    take: number
  ): Promise<
    Array<{
      experimentId: string;
      experimentName: string;
      userId: string;
      groupId: string;
      conditionName: string;
      firstDecisionPointReachedOn: string;
      decisionPointReachedCount: number;
    }>
  > {
    const individualEnrollmentRepository = getCustomRepository(IndividualEnrollmentRepository, 'export');
    return individualEnrollmentRepository
      .createQueryBuilder('individualEnrollment')
      .select([
        'experiment.id as "experimentId"',
        'experiment.name as "experimentName"',
        '"individualEnrollment"."userId" as "userId"',
        '"individualEnrollment"."groupId" as "groupId"',
        'condition."conditionCode" as "conditionName"',
        'MIN("monitoredPointLogs"."createdAt") as "firstDecisionPointReachedOn"',
        'CAST(COUNT("monitoredPointLogs"."id") as int) as "decisionPointReachedCount"',
      ])
      .leftJoin('individualEnrollment.condition', 'condition')
      .innerJoin(Experiment, 'experiment', 'experiment.id = "individualEnrollment"."experimentId"')
      .innerJoin(
        MonitoredDecisionPoint,
        'monitored',
        'monitored."userId" = "individualEnrollment"."userId" AND monitored."decisionPoint" = "individualEnrollment"."partitionId"'
      )
      .leftJoin('monitored.monitoredPointLogs', 'monitoredPointLogs')
      .groupBy('experiment.id')
      .addGroupBy('experiment.name')
      .addGroupBy('"individualEnrollment"."userId"')
      .addGroupBy('"individualEnrollment"."groupId"')
      .addGroupBy('condition."conditionCode"')
      .orderBy('"individualEnrollment"."userId"', 'ASC')
      .skip(skip)
      .take(take)
      .where('"individualEnrollment"."experimentId" = :experimentId', { experimentId })
      .execute();
  }

  public async getEnrollmentByDateRange(
    experimentId: string,
    dateRange: DATE_RANGE,
    clientOffset: number
  ): Promise<[IEnrollmentConditionAndPartitionDate[], IEnrollmentConditionAndPartitionDate[]]> {
    const individualEnrollmentRepository = this.manager.getCustomRepository(IndividualEnrollmentRepository);
    const groupEnrollmentRepository = this.manager.getCustomRepository(GroupEnrollmentRepository);

    const groupByRange = `date_range`;
    const { whereDate: individualWhereDate, selectRange: individualSelectRange } = this.getDateVariables(
      dateRange,
      clientOffset,
      'individualEnrollment'
    );
    const individualEnrollmentConditionAndPartition = individualEnrollmentRepository
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

    const { whereDate: groupWhereDate, selectRange: groupSelectRange } = this.getDateVariables(
      dateRange,
      clientOffset,
      'groupEnrollment'
    );
    const groupEnrollmentConditionAndPartition = groupEnrollmentRepository
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

    return Promise.all([individualEnrollmentConditionAndPartition, groupEnrollmentConditionAndPartition]);
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
