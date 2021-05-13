import { EntityRepository, EntityManager } from 'typeorm';
import { ExperimentRepository } from './ExperimentRepository';
import { IndividualAssignment } from '../models/IndividualAssignment';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import { GroupAssignment } from '../models/GroupAssignment';
import { ExperimentUser } from '../models/ExperimentUser';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { GroupExclusion } from '../models/GroupExclusion';
import { PreviewUser } from '../models/PreviewUser';
import { DATE_RANGE } from 'upgrade_types';

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
  conditions_id: string;
  partitions_id: string;
  count: string;
  date_range: string;
}

@EntityRepository()
export class AnalyticsRepository {
  constructor(private manager: EntityManager) {}

  public async getEnrollments(experimentIds: string[]): Promise<any> {
    if (!experimentIds.length) {
      return [];
    }
    const experimentRepository: ExperimentRepository = this.manager.getCustomRepository(ExperimentRepository);

    // for calculating individual enrollments
    const individualMonitoredExperiment = experimentRepository
      .createQueryBuilder('experiment')
      .select(['"monitoredExperimentPoint"."userId"', 'experiment.id'])
      .innerJoin('experiment.partitions', 'partitions')
      .innerJoin(
        MonitoredExperimentPoint,
        'monitoredExperimentPoint',
        '"monitoredExperimentPoint"."experimentId" = partitions.id'
      )
      .where('experiment.id IN (:...ids)', { ids: experimentIds })
      .andWhere((qb) => {
        const subQuery = qb.subQuery().select('user.id').from(PreviewUser, 'user').getQuery();
        return '"monitoredExperimentPoint"."userId" NOT IN ' + subQuery;
      })
      .getSql();

    const assignment = await experimentRepository
      .createQueryBuilder('experiment')
      .select(['"individualAssignment"."userId"', 'experiment.id'])
      .innerJoin(IndividualAssignment, 'individualAssignment', '"individualAssignment"."experimentId" = experiment.id')
      .where('experiment.id IN (:...ids)', { ids: experimentIds })
      .getSql();

    const groupMonitoredExperiment = experimentRepository
      .createQueryBuilder('experiment')
      .select([`"experimentUser"."workingGroup" -> experiment.group #>> '{}' as "groupId"`, 'experiment.id'])
      .innerJoin('experiment.partitions', 'partitions')
      .innerJoin(
        MonitoredExperimentPoint,
        'monitoredExperimentPoint',
        '"monitoredExperimentPoint"."experimentId" = partitions.id'
      )
      .innerJoin(ExperimentUser, 'experimentUser', '"monitoredExperimentPoint"."userId" = experimentUser.id')
      .where('experiment.id IN (:...ids)', { ids: experimentIds })
      .getSql();

    // for calculating group assignment
    const groupAssignment = await experimentRepository
      .createQueryBuilder('experiment')
      .select(['"groupAssignment"."groupId" as "groupId"', 'experiment.id'])
      .innerJoin(GroupAssignment, 'groupAssignment', '"groupAssignment"."experimentId" = experiment.id')
      .where('experiment.id IN (:...ids)', { ids: experimentIds })
      .getSql();

    const individualSQL = `SELECT i."userId", i."experiment_id" AS "experimentId"  FROM ( ${individualMonitoredExperiment} INTERSECT ${assignment}) i`;
    const groupSQL = `SELECT i."groupId", i."experiment_id" AS "experimentId"  FROM ( ${groupMonitoredExperiment} INTERSECT ${groupAssignment}) i`;

    // const groupMonitoredPoint = await this.manager.query(groupMonitoredExperiment, experimentIds);
    // console.log('groupMonitoredPoint', groupMonitoredPoint);

    // const groupAssignmentResult = await this.manager.query(groupAssignment, experimentIds);
    // console.log('groupAssignmentResult', groupAssignmentResult);

    // const groupResult = await this.manager.query(groupSQL, experimentIds);
    // console.log('groupResult', groupResult);

    let result = await this.manager.query(
      `SELECT cast(COUNT(DISTINCT(i."userId")) as int) as users, cast(COUNT( DISTINCT(g."groupId")) as int) as groups, i."experimentId" FROM (${individualSQL}) i LEFT JOIN (${groupSQL}) as g ON i."experimentId" = g."experimentId" GROUP BY i."experimentId"`,
      experimentIds
    );
    result = experimentIds.map((id) => {
      const expDataFound = result.find((exp) => exp.experimentId === id);
      if (!expDataFound) {
        return {
          users: 0,
          groups: 0,
          id,
        };
      } else {
        const response = { ...expDataFound, id: expDataFound.experimentId };
        delete response.experimentId;
        return response;
      }
    });
    return result;
  }

  public async getDetailEnrollment(
    experimentId: string
  ): Promise<
    [
      IEnrollmentByCondition[],
      IEnrollmentConditionAndPartition[],
      IEnrollmentByCondition[],
      IEnrollmentConditionAndPartition[],
      IExcluded[],
      IExcluded[]
    ]
  > {
    const experimentRepository: ExperimentRepository = this.manager.getCustomRepository(ExperimentRepository);

    const individualEnrollmentByCondition = experimentRepository
      .createQueryBuilder('experiment')
      .select(['count(distinct("individualAssignment"."userId"))', 'conditions.id'])
      .innerJoin('experiment.conditions', 'conditions')
      .innerJoin('experiment.partitions', 'partitions')
      .innerJoin(
        IndividualAssignment,
        'individualAssignment',
        '"individualAssignment"."experimentId" = experiment.id AND conditions.id = "individualAssignment"."conditionId"'
      )
      .innerJoin(
        MonitoredExperimentPoint,
        'monitoredExperimentPoint',
        '"monitoredExperimentPoint"."experimentId" = partitions.id AND "individualAssignment"."userId" = "monitoredExperimentPoint"."userId"'
      )
      .groupBy('conditions.id')
      .where('experiment.id = :id', { id: experimentId })
      .andWhere((qb) => {
        const subQuery = qb.subQuery().select('user.id').from(PreviewUser, 'user').getQuery();
        return '"monitoredExperimentPoint"."userId" NOT IN ' + subQuery;
      })
      .execute() as any;

    // get individual enrollment
    const individualEnrollmentConditionAndPartition = experimentRepository
      .createQueryBuilder('experiment')
      .select(['count(distinct("individualAssignment"."userId"))', 'conditions.id', 'partitions.id'])
      .innerJoin('experiment.conditions', 'conditions')
      .innerJoin('experiment.partitions', 'partitions')
      .innerJoin(
        IndividualAssignment,
        'individualAssignment',
        '"individualAssignment"."experimentId" = experiment.id AND conditions.id = "individualAssignment"."conditionId"'
      )
      .innerJoin(
        MonitoredExperimentPoint,
        'monitoredExperimentPoint',
        '"monitoredExperimentPoint"."experimentId" = partitions.id AND "individualAssignment"."userId" = "monitoredExperimentPoint"."userId"'
      )
      .groupBy('conditions.id')
      .addGroupBy('partitions.id')
      .where('experiment.id = :id', { id: experimentId })
      .andWhere((qb) => {
        const subQuery = qb.subQuery().select('user.id').from(PreviewUser, 'user').getQuery();
        return '"monitoredExperimentPoint"."userId" NOT IN ' + subQuery;
      })
      .execute() as any;

    const individualExcluded = experimentRepository
      .createQueryBuilder('experiment')
      .select('count(*)')
      .innerJoin(IndividualExclusion, 'individualExclusion', '"individualExclusion"."experimentId" = experiment.id')
      .where('experiment.id = :id', { id: experimentId })
      .execute();

    const groupEnrollmentByCondition = experimentRepository
      .createQueryBuilder('experiment')
      .select(['count(distinct("groupAssignment"."groupId"))', 'conditions.id'])
      .innerJoin('experiment.conditions', 'conditions')
      .innerJoin('experiment.partitions', 'partitions')
      .innerJoin(
        GroupAssignment,
        'groupAssignment',
        '"groupAssignment"."experimentId" = experiment.id AND conditions.id = "groupAssignment"."conditionId"'
      )
      .innerJoin(
        MonitoredExperimentPoint,
        'monitoredExperimentPoint',
        '"monitoredExperimentPoint"."experimentId" = partitions.id'
      )
      .innerJoin(ExperimentUser, 'experimentUser', '"monitoredExperimentPoint"."userId" = "experimentUser".id')
      .where('experiment.id = :id', { id: experimentId })
      .andWhere(`"experimentUser"."workingGroup" -> experiment.group #>> '{}' = "groupAssignment"."groupId"`)
      .groupBy('conditions.id')
      .addGroupBy('partitions.id')
      .execute() as any;

    const groupEnrollmentConditionAndPartition = experimentRepository
      .createQueryBuilder('experiment')
      .select(['count(distinct("groupAssignment"."groupId"))', 'conditions.id', 'partitions.id'])
      .innerJoin('experiment.conditions', 'conditions')
      .innerJoin('experiment.partitions', 'partitions')
      .innerJoin(
        GroupAssignment,
        'groupAssignment',
        '"groupAssignment"."experimentId" = experiment.id AND conditions.id = "groupAssignment"."conditionId"'
      )
      .innerJoin(
        MonitoredExperimentPoint,
        'monitoredExperimentPoint',
        '"monitoredExperimentPoint"."experimentId" = partitions.id'
      )
      .innerJoin(ExperimentUser, 'experimentUser', '"monitoredExperimentPoint"."userId" = "experimentUser".id')
      .where('experiment.id = :id', { id: experimentId })
      .andWhere(`"experimentUser"."workingGroup" -> experiment.group #>> '{}' = "groupAssignment"."groupId"`)
      .groupBy('conditions.id')
      .addGroupBy('partitions.id')
      .execute() as any;

    const groupExcluded = experimentRepository
      .createQueryBuilder('experiment')
      .select('count(*)')
      .innerJoin(GroupExclusion, 'groupExclusion', '"groupExclusion"."experimentId" = experiment.id')
      .where('experiment.id = :id', { id: experimentId })
      .execute();

    return Promise.all([
      individualEnrollmentByCondition,
      individualEnrollmentConditionAndPartition,
      groupEnrollmentByCondition,
      groupEnrollmentConditionAndPartition,
      individualExcluded,
      groupExcluded,
    ]);
  }

  public async getEnrollmentByDateRange(
    experimentId: string,
    dateRange: DATE_RANGE
  ): Promise<[IEnrollmentConditionAndPartitionDate[], IEnrollmentConditionAndPartitionDate[]]> {
    const experimentRepository: ExperimentRepository = await this.manager.getCustomRepository(ExperimentRepository);

    let whereDate = '';
    let selectRange = '';
    const groupByRange = `date_range`;
    switch (dateRange) {
      case DATE_RANGE.LAST_SEVEN_DAYS:
        whereDate = `"monitoredExperimentPoint"."createdAt" > current_date - interval '7 days'`;
        selectRange = `date_trunc('day', "monitoredExperimentPoint"."createdAt") AS date_range`;
        break;
      case DATE_RANGE.LAST_THREE_MONTHS:
        whereDate = `"monitoredExperimentPoint"."createdAt" > current_date - interval '3 months'`;
        selectRange = `date_trunc('month', "monitoredExperimentPoint"."createdAt") AS date_range`;
        break;
      case DATE_RANGE.LAST_SIX_MONTHS:
        whereDate = `"monitoredExperimentPoint"."createdAt" > current_date - interval '6 months'`;
        selectRange = `date_trunc('month', "monitoredExperimentPoint"."createdAt") AS date_range`;
        break;
      default:
        whereDate = `"monitoredExperimentPoint"."createdAt" > current_date - interval '12 months'`;
        selectRange = `date_trunc('month', "monitoredExperimentPoint"."createdAt") AS date_range`;
        break;
    }

    // const individualEnrollmentByCondition = experimentRepository
    //   .createQueryBuilder('experiment')
    //   .select(['count(distinct("individualAssignment"."userId"))', 'conditions.id', selectRange])
    //   .innerJoin('experiment.conditions', 'conditions')
    //   .innerJoin('experiment.partitions', 'partitions')
    //   .innerJoin(
    //     IndividualAssignment,
    //     'individualAssignment',
    //     '"individualAssignment"."experimentId" = experiment.id AND conditions.id = "individualAssignment"."conditionId"'
    //   )
    //   .innerJoin(
    //     MonitoredExperimentPoint,
    //     'monitoredExperimentPoint',
    //     '"monitoredExperimentPoint"."experimentId" = partitions.id AND "individualAssignment"."userId" = "monitoredExperimentPoint"."userId"'
    //   )
    //   .groupBy('conditions.id')
    //   .addGroupBy(groupByRange)
    //   .where('experiment.id = :id', { id: experimentId })
    //   .andWhere(whereDate)
    //   .andWhere((qb) => {
    //     const subQuery = qb.subQuery().select('user.id').from(PreviewUser, 'user').getQuery();
    //     return '"monitoredExperimentPoint"."userId" NOT IN ' + subQuery;
    //   })
    //   .execute() as any;

    const individualEnrollmentConditionAndPartition = experimentRepository
      .createQueryBuilder('experiment')
      .select(['count(distinct("individualAssignment"."userId"))', 'conditions.id', 'partitions.id', selectRange])
      .innerJoin('experiment.conditions', 'conditions')
      .innerJoin('experiment.partitions', 'partitions')
      .innerJoin(
        IndividualAssignment,
        'individualAssignment',
        '"individualAssignment"."experimentId" = experiment.id AND conditions.id = "individualAssignment"."conditionId"'
      )
      .innerJoin(
        MonitoredExperimentPoint,
        'monitoredExperimentPoint',
        '"monitoredExperimentPoint"."experimentId" = partitions.id AND "individualAssignment"."userId" = "monitoredExperimentPoint"."userId"'
      )
      .groupBy('conditions.id')
      .addGroupBy('partitions.id')
      .addGroupBy(groupByRange)
      .where('experiment.id = :id', { id: experimentId })
      .andWhere(whereDate)
      .andWhere((qb) => {
        const subQuery = qb.subQuery().select('user.id').from(PreviewUser, 'user').getQuery();
        return '"monitoredExperimentPoint"."userId" NOT IN ' + subQuery;
      })
      .execute() as any;

    // const individualExcluded = experimentRepository
    //   .createQueryBuilder('experiment')
    //   .select('count(*)')
    //   .innerJoin(IndividualExclusion, 'individualExclusion', '"individualExclusion"."experimentId" = experiment.id')
    //   .where('experiment.id = :id', { id: experimentId })
    //   .execute();

    // const groupEnrollmentByCondition = experimentRepository
    //   .createQueryBuilder('experiment')
    //   .select(['count(distinct("groupAssignment"."groupId"))', 'conditions.id', selectRange])
    //   .innerJoin('experiment.conditions', 'conditions')
    //   .innerJoin('experiment.partitions', 'partitions')
    //   .innerJoin(
    //     GroupAssignment,
    //     'groupAssignment',
    //     '"groupAssignment"."experimentId" = experiment.id AND conditions.id = "groupAssignment"."conditionId"'
    //   )
    //   .innerJoin(
    //     MonitoredExperimentPoint,
    //     'monitoredExperimentPoint',
    //     '"monitoredExperimentPoint"."experimentId" = partitions.id'
    //   )
    //   .innerJoin(ExperimentUser, 'experimentUser', '"monitoredExperimentPoint"."userId" = "experimentUser".id')
    //   .where('experiment.id = :id', { id: experimentId })
    //   .andWhere(whereDate)
    //   .andWhere(`"experimentUser"."workingGroup" -> experiment.group #>> '{}' = "groupAssignment"."groupId"`)
    //   .groupBy('conditions.id')
    //   .addGroupBy('partitions.id')
    //   .addGroupBy(groupByRange)
    //   .execute() as any;

    const groupEnrollmentConditionAndPartition = experimentRepository
      .createQueryBuilder('experiment')
      .select(['count(distinct("groupAssignment"."groupId"))', 'conditions.id', 'partitions.id', selectRange])
      .innerJoin('experiment.conditions', 'conditions')
      .innerJoin('experiment.partitions', 'partitions')
      .innerJoin(
        GroupAssignment,
        'groupAssignment',
        '"groupAssignment"."experimentId" = experiment.id AND conditions.id = "groupAssignment"."conditionId"'
      )
      .innerJoin(
        MonitoredExperimentPoint,
        'monitoredExperimentPoint',
        '"monitoredExperimentPoint"."experimentId" = partitions.id'
      )
      .innerJoin(ExperimentUser, 'experimentUser', '"monitoredExperimentPoint"."userId" = "experimentUser".id')
      .where('experiment.id = :id', { id: experimentId })
      .andWhere(whereDate)
      .andWhere(`"experimentUser"."workingGroup" -> experiment.group #>> '{}' = "groupAssignment"."groupId"`)
      .groupBy('conditions.id')
      .addGroupBy(groupByRange)
      .addGroupBy('partitions.id')
      .execute() as any;

    // const groupExcluded = experimentRepository
    //   .createQueryBuilder('experiment')
    //   .select('count(*)')
    //   .innerJoin(GroupExclusion, 'groupExclusion', '"groupExclusion"."experimentId" = experiment.id')
    //   .where('experiment.id = :id', { id: experimentId })
    //   .execute();

    return Promise.all([individualEnrollmentConditionAndPartition, groupEnrollmentConditionAndPartition]);
  }
}
