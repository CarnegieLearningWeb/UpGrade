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
import { ExperimentUserRepository } from '../repositories/ExperimentUserRepository';
import { ExperimentUser } from '../models/ExperimentUser';
import { ASSIGNMENT_UNIT, IExperimentEnrollmentStats } from 'ees_types';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { GroupAssignment } from '../models/GroupAssignment';
import { GroupExclusion } from '../models/GroupExclusion';

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
    private experimentUserRepository: ExperimentUserRepository
  ) {}

  public async getStats(experimentIds: string[]): Promise<IExperimentEnrollmentStats[]> {
    // get experiment definition
    const experimentDefinition = await this.experimentRepository.findByIds(experimentIds, {
      relations: ['partitions', 'conditions'],
    });

    // if no experiment definition return empty array
    if (experimentDefinition && experimentDefinition.length === 0) {
      return [];
    }

    const experimentIdAndPoint = [];
    experimentDefinition.forEach((experiment) => {
      const partitions = experiment.partitions;
      partitions.forEach((partition) => {
        const experimentId = partition.id;
        experimentIdAndPoint.push(experimentId);
      });
    });

    // data for all
    const promiseData = await Promise.all([
      this.monitoredExperimentPointRepository.find({
        where: { experimentId: In(experimentIdAndPoint) },
        relations: ['user'],
      }),
      this.individualAssignmentRepository.find({
        where: { experimentId: In(experimentIds) },
        relations: ['experiment', 'user', 'condition'],
      }),
      this.individualExclusionRepository.find({
        where: { experimentId: In(experimentIds) },
        relations: ['experiment', 'user'],
      }),
      this.groupAssignmentRepository.find({
        where: { experimentId: In(experimentIds) },
        relations: ['experiment', 'condition'],
      }),
      this.groupExclusionRepository.find({
        where: { experimentId: In(experimentIds) },
        relations: ['experiment'],
      }),
    ]);

    const monitoredExperimentPoints: MonitoredExperimentPoint[] = promiseData[0] as any;
    const individualAssignments: IndividualAssignment[] = promiseData[1] as any;
    const individualExclusions: IndividualExclusion[] = promiseData[2] as any;
    const groupAssignments: GroupAssignment[] = promiseData[3] as any;
    const groupExclusions: GroupExclusion[] = promiseData[4] as any;

    // making map of primary keys
    const mappedMonitoredExperimentPoint = new Map<string, MonitoredExperimentPoint>();
    const mappedUserDefinition = new Map<string, ExperimentUser>();
    const mappedIndividualAssignment = new Map<string, IndividualAssignment>();

    // mappedMonitoredExperimentPoint
    monitoredExperimentPoints.forEach((monitoredPoint) => {
      mappedMonitoredExperimentPoint.set(monitoredPoint.id, monitoredPoint);
    });

    // get user definition
    const userDefinition =
      (await this.experimentUserRepository.findByIds(
        monitoredExperimentPoints.map((monitoredPoint) => monitoredPoint.user.id)
      )) || [];

    // mappedUserDefinition
    userDefinition.forEach((user) => {
      mappedUserDefinition.set(user.id, user);
    });

    // mappedIndividualAssignment
    individualAssignments.forEach((individualAssignment) => {
      mappedIndividualAssignment.set(individualAssignment.id, individualAssignment);
    });

    // structure data here
    const experimentsStats: IExperimentEnrollmentStats[] = experimentDefinition.map(
      (experiment): IExperimentEnrollmentStats => {
        const usersAssignedToExperiment = individualAssignments.filter((individualAssignment) => {
          return individualAssignment.experiment.id === experiment.id;
        });

        const usersExcludedFromExperiment = individualExclusions.filter((individualExclusion) => {
          return individualExclusion.experiment.id === experiment.id;
        });

        const groupAssignedToExperiment =
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
            groupAssignments.filter((groupAssignment) => {
              return groupAssignment.experiment.id === experiment.id;
            })) ||
          [];

        const groupExcludedFromExperiment =
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
            groupExclusions.filter((groupExclusion) => {
              return groupExclusion.experiment.id === experiment.id;
            })) ||
          [];

        const conditionStats = experiment.conditions.map((condition) => {
          const conditionAssignedUser = usersAssignedToExperiment.filter((userPartition) => {
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
