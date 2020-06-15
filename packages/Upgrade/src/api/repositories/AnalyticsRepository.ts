import { EntityRepository, EntityManager } from 'typeorm';
import { ExperimentRepository } from './ExperimentRepository';
import { IndividualAssignment } from '../models/IndividualAssignment';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import { GroupAssignment } from '../models/GroupAssignment';
import { ExperimentUser } from '../models/ExperimentUser';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { GroupExclusion } from '../models/GroupExclusion';

@EntityRepository()
export class AnalyticsRepository {
  constructor(private manager: EntityManager) { }

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
      `SELECT cast(COUNT(DISTINCT(i."userId")) as int) as user, cast(COUNT( DISTINCT(g."groupId")) as int) as group, i."experimentId" FROM (${individualSQL}) i LEFT JOIN (${groupSQL}) as g ON i."experimentId" = g."experimentId" GROUP BY i."experimentId"`,
      experimentIds
    );
    result = experimentIds.map(id => {
      const expDataFound = result.find(exp => exp.experimentId === id);
      if (!expDataFound) {
        return {
          user: 0,
          group: 0,
          experimentId: id,
        };
      }
      return expDataFound;
    });
    return result;
  }

  public async getDetailEnrollment(experimentId: string, from: Date, to: Date): Promise<any> {
    const experimentRepository: ExperimentRepository = this.manager.getCustomRepository(ExperimentRepository);

    let searchText = '';
    if (from) {
      searchText = searchText + 'monitoredExperimentPoint.createdAt > :from';
    }
    if (to) {
      searchText = searchText + ' AND monitoredExperimentPoint.createdAt < :to';
    }

    // get individual enrollment
    let individualEnrollment = experimentRepository
      .createQueryBuilder('experiment')
      .select(['"individualAssignment"."userId"', 'conditions.id', 'partitions.id'])
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
      .where('experiment.id = :id', { id: experimentId });

    if (searchText) {
      individualEnrollment = individualEnrollment.andWhere(searchText, { from, to });
    }
    individualEnrollment = individualEnrollment.execute() as any;

    const individualExcluded = experimentRepository
      .createQueryBuilder('experiment')
      .select('count(*)')
      .innerJoin(IndividualExclusion, 'individualExclusion', '"individualExclusion"."experimentId" = experiment.id')
      .where('experiment.id = :id', { id: experimentId })
      .execute();

    let groupEnrollment = experimentRepository
      .createQueryBuilder('experiment')
      .select(['"groupAssignment"."groupId"', 'conditions.id', 'partitions.id'])
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
      .andWhere(`"experimentUser"."workingGroup" -> experiment.group #>> '{}' = "groupAssignment"."groupId"`);

    if (searchText) {
      groupEnrollment = groupEnrollment.andWhere(searchText, { from, to });
    }
    groupEnrollment = groupEnrollment.execute() as any;

    const groupExcluded = experimentRepository
      .createQueryBuilder('experiment')
      .select('count(*)')
      .innerJoin(GroupExclusion, 'groupExclusion', '"groupExclusion"."experimentId" = experiment.id')
      .where('experiment.id = :id', { id: experimentId })
      .execute();

    return Promise.all([individualEnrollment, groupEnrollment, individualExcluded, groupExcluded]);
  }
}
