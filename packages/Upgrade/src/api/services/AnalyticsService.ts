import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { MonitoredExperimentPointRepository } from '../repositories/MonitoredExperimentPointRepository';
import { IndividualAssignmentRepository } from '../repositories/IndividualAssignmentRepository';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { GroupAssignmentRepository } from '../repositories/GroupAssignmentRepository';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { In } from 'typeorm';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import { IndividualAssignment } from '../models/IndividualAssignment';
import { ExperimentUser } from '../models/ExperimentUser';
import { ASSIGNMENT_UNIT, IExperimentEnrollmentStats } from 'ees_types';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { GroupAssignment } from '../models/GroupAssignment';
import { GroupExclusion } from '../models/GroupExclusion';
import { ASSIGNMENT_TYPE } from '../../types/index';

@Service()
export class AnalyticsService {
  constructor(
    @OrmRepository()
    private experimentRepository: ExperimentRepository,
    @OrmRepository()
    private monitoredExperimentPointRepository: MonitoredExperimentPointRepository,
    @OrmRepository()
    private individualAssignmentRepository: IndividualAssignmentRepository,
    @OrmRepository()
    private individualExclusionRepository: IndividualExclusionRepository,
    @OrmRepository()
    private groupExclusionRepository: GroupExclusionRepository,
    @OrmRepository()
    private groupAssignmentRepository: GroupAssignmentRepository
  ) {}

  public async getStats(experimentIds: string[]): Promise<IExperimentEnrollmentStats[]> {
    return Promise.all(
      experimentIds.map(async (experimentId) => {
        // get experiment definition
        const experiment = await this.experimentRepository.findOne({
          where: { id: experimentId },
          relations: ['partitions', 'conditions'],
        });

        // when experiment is not defined
        if (!experiment) {
          return {
            id: experimentId,
            users: 0,
            group: 0,
            userExcluded: 0,
            groupExcluded: 0,
            conditions: {} as any,
            partitions: {} as any,
          };
        }

        const experimentIdAndPoint = [];
        const partitions = experiment.partitions;
        partitions.forEach((partition) => {
          const partitionId = partition.id;
          experimentIdAndPoint.push(partitionId);
        });

        // data for all
        const promiseData = await Promise.all([
          this.monitoredExperimentPointRepository.find({
            where: { experimentId: In(experimentIdAndPoint) },
            relations: ['user'],
          }),
          this.individualAssignmentRepository.find({
            where: { experimentId, assignmentType: ASSIGNMENT_TYPE.ALGORITHMIC },
            relations: ['experiment', 'user', 'condition'],
          }),
          this.individualExclusionRepository.find({
            where: { experimentId },
            relations: ['experiment', 'user'],
          }),
          this.groupAssignmentRepository.find({
            where: { experimentId },
            relations: ['experiment', 'condition'],
          }),
          this.groupExclusionRepository.find({
            where: { experimentId },
            relations: ['experiment'],
          }),
        ]);

        const monitoredExperimentPoints: MonitoredExperimentPoint[] = promiseData[0] as any;
        let individualAssignments: IndividualAssignment[] = promiseData[1] as any;
        const individualExclusions: IndividualExclusion[] = promiseData[2] as any;
        const groupAssignments: GroupAssignment[] = promiseData[3] as any;
        const groupExclusions: GroupExclusion[] = promiseData[4] as any;

        // console.log('individualAssignments', individualAssignments);
        // console.log('individualExclusions', individualExclusions);

        // filter individual assignment
        individualAssignments = individualAssignments.filter((individualAssignment) => {
          const user = individualAssignment.user.id;
          const exist = monitoredExperimentPoints.find((monitoredExperimentPoint) => {
            return monitoredExperimentPoint.user.id === user;
          });
          return exist ? true : false;
        });

        // making map of primary keys
        const mappedMonitoredExperimentPoint = new Map<string, MonitoredExperimentPoint>();
        const mappedUserDefinition = new Map<string, ExperimentUser>();
        const mappedIndividualAssignment = new Map<string, IndividualAssignment>();

        // mappedMonitoredExperimentPoint
        monitoredExperimentPoints.forEach((monitoredPoint) => {
          mappedMonitoredExperimentPoint.set(monitoredPoint.id, monitoredPoint);
        });

        // get user definition
        const userDefinition = monitoredExperimentPoints.map((monitoredPoint) => monitoredPoint.user) || [];

        // mappedUserDefinition
        userDefinition.forEach((user) => {
          mappedUserDefinition.set(user.id, user);
        });

        // mappedIndividualAssignment
        individualAssignments.forEach((individualAssignment) => {
          mappedIndividualAssignment.set(individualAssignment.id, individualAssignment);
        });

        const conditionStats = experiment.conditions.map((condition) => {
          const conditionAssignedUser = individualAssignments.filter((userPartition) => {
            return (
              mappedIndividualAssignment.has(`${experiment.id}_${userPartition.user.id}`) &&
              mappedIndividualAssignment.get(`${experiment.id}_${userPartition.user.id}`).condition.id === condition.id
            );
          });

          const conditionAssignedGroup =
            (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
              Array.from(
                new Set(
                  conditionAssignedUser.map(
                    (monitoredPoint) =>
                      mappedUserDefinition.has(monitoredPoint.user.id) &&
                      mappedUserDefinition.get(monitoredPoint.user.id)[experiment.group]
                  )
                )
              )) ||
            [];

          return {
            id: condition.id,
            user: conditionAssignedUser.length,
            group: conditionAssignedGroup.length,
          };
        });

        const partitionStats = experiment.partitions.map((partition) => {
          const partitionId = partition.id;
          const usersPartitionIncluded = monitoredExperimentPoints.filter((monitoredPoint) => {
            return (
              monitoredPoint.experimentId === partitionId &&
              mappedIndividualAssignment.has(`${experiment.id}_${monitoredPoint.user.id}`)
            );
          });

          const groupPartitionIncluded =
            (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
              Array.from(
                new Set(
                  usersPartitionIncluded.map(
                    (monitoredPoint) => mappedUserDefinition.get(monitoredPoint.user.id)[experiment.group]
                  )
                )
              )) ||
            [];

          // condition
          const conditions = experiment.conditions.map((condition) => {
            const conditionAssignedUser = usersPartitionIncluded.filter((userPartition) => {
              return (
                mappedIndividualAssignment.has(`${experiment.id}_${userPartition.user.id}`) &&
                mappedIndividualAssignment.get(`${experiment.id}_${userPartition.user.id}`).condition.id ===
                  condition.id
              );
            });

            const conditionAssignedGroup =
              (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
                Array.from(
                  new Set(
                    conditionAssignedUser.map(
                      (monitoredPoint) => mappedUserDefinition.get(monitoredPoint.user.id)[experiment.group]
                    )
                  )
                )) ||
              [];
            return {
              id: condition.id,
              user: conditionAssignedUser.length,
              group: conditionAssignedGroup.length,
            };
          });

          return {
            id: partitionId,
            user: usersPartitionIncluded.length,
            group: groupPartitionIncluded.length,
            conditions,
          };
        });

        return {
          id: experiment.id,
          users: individualAssignments.length,
          group: groupAssignments.length,
          userExcluded: individualExclusions.length,
          groupExcluded: groupExclusions.length,
          partitions: partitionStats,
          conditions: conditionStats,
        } as IExperimentEnrollmentStats;
      })
    );
  }
}
