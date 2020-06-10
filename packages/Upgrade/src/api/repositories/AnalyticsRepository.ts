import { EntityRepository, EntityManager } from 'typeorm';
import { ExperimentRepository } from './ExperimentRepository';
import { IndividualAssignment } from '../models/IndividualAssignment';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import { GroupAssignment } from '../models/GroupAssignment';
import { ExperimentUser } from '../models/ExperimentUser';

@EntityRepository()
export class AnalyticsRepository {
  constructor(private manager: EntityManager) {}

  public async getEnrollments(experimentIds: string[]): Promise<any> {
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

    return this.manager.query(
      `SELECT cast(COUNT(DISTINCT(i."userId")) as int) as user, cast(COUNT( DISTINCT(g."groupId")) as int) as group, i."experimentId" FROM (${individualSQL}) i LEFT JOIN (${groupSQL}) as g ON i."experimentId" = g."experimentId" GROUP BY i."experimentId"`,
      experimentIds
    );
  }
}
