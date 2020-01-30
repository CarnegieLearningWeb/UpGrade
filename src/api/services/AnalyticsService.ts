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
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';
import { ASSIGNMENT_UNIT, IExperimentEnrollmentStats } from 'ees_types';

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
    private groupAssignmentRepository: GroupAssignmentRepository,
    @OrmRepository()
    private userRepository: UserRepository
  ) {}

  public async getStats(experimentIds: string[]): Promise<IExperimentEnrollmentStats[]> {
    // get experiment definition
    const experimentDefinition = await this.experimentRepository.findByIds(experimentIds, {
      relations: ['partitions', 'conditions'],
    });

    if (experimentDefinition && experimentDefinition.length === 0) {
      return [];
    }

    const experimentIdAndPoint = [];
    experimentDefinition.forEach(experiment => {
      const partitions = experiment.partitions;
      partitions.map(partition => {
        experimentIdAndPoint.push(`${partition.name}_${partition.point}`);
      });
    });

    // data for all
    const [
      monitoredExperimentPoints,
      individualAssignments,
      individualExclusions,
      groupAssignments,
      groupExclusions,
    ] = await Promise.all([
      this.monitoredExperimentPointRepository.find({
        where: { id: In(experimentIdAndPoint) },
      }),
      this.individualAssignmentRepository.find({
        where: { experimentId: In(experimentIds) },
        relations: ['condition'],
      }),
      this.individualExclusionRepository.find({
        where: { experimentId: In(experimentIds) },
      }),
      this.groupAssignmentRepository.find({
        where: { experimentId: In(experimentIds) },
      }),
      this.groupExclusionRepository.find({
        where: { experimentId: In(experimentIds) },
      }),
    ]);

    // console.log(
    //   'All data logged',
    //   monitoredExperimentPoints,
    //   individualAssignments,
    //   individualExclusions,
    //   groupAssignments,
    //   groupExclusions
    // );

    // making map of primary keys
    const mappedMonitoredExperimentPoint = new Map<string, MonitoredExperimentPoint>();
    const mappedUserDefinition = new Map<string, User>();
    const mappedIndividualAssignment = new Map<string, IndividualAssignment>();

    // mappedMonitoredExperimentPoint
    monitoredExperimentPoints.forEach(monitoredPoint => {
      mappedMonitoredExperimentPoint.set(`${monitoredPoint.id}_${monitoredPoint.userId}`, monitoredPoint);
    });

    // get user definition
    const userDefinition =
      (await this.userRepository.findByIds(monitoredExperimentPoints.map(monitoredPoint => monitoredPoint.userId))) ||
      [];

    // mappedUserDefinition
    userDefinition.forEach(user => {
      mappedUserDefinition.set(user.id, user);
    });

    // mappedIndividualAssignment
    individualAssignments.forEach((individualAssignment: any) => {
      mappedIndividualAssignment.set(
        `${individualAssignment.experimentId}_${individualAssignment.userId}`,
        individualAssignment
      );
    });

    // structure data here
    const experimentsStats: IExperimentEnrollmentStats[] = experimentDefinition.map(
      (experiment): IExperimentEnrollmentStats => {
        const usersAssignedToExperiment = individualAssignments.filter(individualAssignment => {
          return individualAssignment.experimentId === experiment.id;
        });
        const usersExcludedFromExperiment = individualExclusions.filter(individualExclusion => {
          return individualExclusion.experimentId === experiment.id;
        });

        const groupAssignedToExperiment =
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
            groupAssignments.filter(groupAssignment => {
              return groupAssignment.experimentId === experiment.id;
            })) ||
          [];
        const groupExcludedFromExperiment =
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
            groupExclusions.filter(groupExclusion => {
              return groupExclusion.experimentId === experiment.id;
            })) ||
          [];

        const conditionStats = experiment.conditions.map(condition => {
          const conditionAssignedUser = usersAssignedToExperiment.filter(userPartition => {
            return (
              mappedIndividualAssignment.has(`${experiment.id}_${userPartition.userId}`) &&
              mappedIndividualAssignment.get(`${experiment.id}_${userPartition.userId}`).condition.id === condition.id
            );
          });
          const conditionAssignedGroup =
            (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
              Array.from(
                new Set(
                  conditionAssignedUser.map(
                    monitoredPoint => mappedUserDefinition.get(monitoredPoint.userId)[experiment.group]
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

        const partitionStats = experiment.partitions.map(partition => {
          const partitionId = partition.id;

          const usersPartitionIncluded = monitoredExperimentPoints.filter(monitoredPoint => {
            return (
              monitoredPoint.id === partitionId &&
              mappedIndividualAssignment.has(`${experiment.id}_${monitoredPoint.userId}`)
            );
          });

          const groupPartitionIncluded =
            (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
              Array.from(
                new Set(
                  usersPartitionIncluded.map(
                    monitoredPoint => mappedUserDefinition.get(monitoredPoint.userId)[experiment.group]
                  )
                )
              )) ||
            [];

          // condition
          const conditions = experiment.conditions.map(condition => {
            const conditionAssignedUser = usersPartitionIncluded.filter(userPartition => {
              return (
                mappedIndividualAssignment.has(`${experiment.id}_${userPartition.userId}`) &&
                mappedIndividualAssignment.get(`${experiment.id}_${userPartition.userId}`).condition.id === condition.id
              );
            });

            const conditionAssignedGroup =
              (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
                Array.from(
                  new Set(
                    conditionAssignedUser.map(
                      monitoredPoint => mappedUserDefinition.get(monitoredPoint.userId)[experiment.group]
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
          users: usersAssignedToExperiment.length,
          group: groupAssignedToExperiment.length,
          userExcluded: usersExcludedFromExperiment.length,
          groupExcluded: groupExcludedFromExperiment.length,
          partitions: partitionStats,
          conditions: conditionStats,
        };
      }
    );

    return experimentsStats;
  }
}
