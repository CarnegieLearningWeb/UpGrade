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
import { ASSIGNMENT_UNIT, IExperimentEnrollmentStats } from 'upgrade_types';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { GroupAssignment } from '../models/GroupAssignment';
import { GroupExclusion } from '../models/GroupExclusion';
import { ASSIGNMENT_TYPE } from '../../types/index';
import { Experiment } from '../models/Experiment';

// interface IExperimentEnrollmentStatsByDate {
//   individualAssignments: IndividualAssignment[];
//   individualExclusionCount: number;
//   groupAssignments: GroupAssignment[];
//   groupExclusionCount: number;
// }

// interface RelevantDocuments {
//   id: string;
//   documentIds: string[];
// }

// interface ConditionStats {
//   id: string;
//   totalUsers: string[];
//   totalGroups: string[];
//   partitions: Array<{
//     id: string;
//     totalUsers: string[];
//     totalGroups: string[];
//   }>;
// }

// interface ConditionStats {

// }

// interface PartitionStats {
//   id: string;
//   totalUsers: string[];
//   totalGroups: [];
//   conditions: Array<{
//     id: string;
//     totalUsers: string[];
//     totalGroups: string[];
//   }>;
// }

// interface IExperimentDateStat {
//   individualExclusionCount: number;
//   groupExclusionCount: number;
//   conditionsStats: RelevantDocuments[];
//   partitionsStats: RelevantDocuments[];
//   markedDocuments: MonitoredExperimentPoint[];
// }

interface IExperimentDateStat {
  userId: string;
  groupId: string | undefined;
  conditionId: string;
  partitionIds: string[];
}

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
        const individualAssignments: IndividualAssignment[] = promiseData[1] as any;
        const individualExclusions: IndividualExclusion[] = promiseData[2] as any;
        const groupAssignments: GroupAssignment[] = promiseData[3] as any;
        const groupExclusions: GroupExclusion[] = promiseData[4] as any;

        return this.getStatsData(
          experiment,
          monitoredExperimentPoints,
          individualAssignments,
          individualExclusions,
          groupAssignments,
          groupExclusions
        );
      })
    );
  }

  public async getEnrolmentStatsByDate(experimentId: string, from: Date, to: Date): Promise<IExperimentDateStat[]> {
    const experiment = await this.experimentRepository.findOne({
      where: { id: experimentId },
      relations: ['partitions', 'conditions'],
    });
    // when experiment is not defined
    if (!experiment) {
      return {} as any;
    }
    const experimentIdAndPoint = [];
    const partitions = experiment.partitions;
    partitions.forEach((partition) => {
      const partitionId = partition.id;
      experimentIdAndPoint.push(partitionId);
    });
    const promiseData = await Promise.all([
      this.monitoredExperimentPointRepository.getByDateRange(experimentIdAndPoint, from, to),
      this.individualAssignmentRepository.find({
        where: { experimentId, assignmentType: ASSIGNMENT_TYPE.ALGORITHMIC },
        relations: ['experiment', 'user', 'condition'],
      }),
      this.individualExclusionRepository.find({
        where: { experimentId },
        relations: ['experiment', 'user'],
      }),
    ]);
    const monitoredExperimentPoints: MonitoredExperimentPoint[] = promiseData[0] as any;
    const individualAssignments: IndividualAssignment[] = promiseData[1] as any;

    const userMap: Map<string, IExperimentDateStat> = new Map();

    // monitored document per user
    monitoredExperimentPoints.forEach((monitoredExperimentPoint) => {
      const document = userMap.get(monitoredExperimentPoint.user.id);
      const userGroup = monitoredExperimentPoint.user.workingGroup
        ? monitoredExperimentPoint.user.workingGroup[experiment.group]
        : undefined;
      userMap.set(monitoredExperimentPoint.user.id, {
        userId: monitoredExperimentPoint.user.id,
        groupId: experiment.group ? userGroup : undefined,
        partitionIds: document
          ? [...document.partitionIds, monitoredExperimentPoint.experimentId]
          : [monitoredExperimentPoint.experimentId],
        conditionId: 'default',
      });
    });

    // add conditions based on individual assignments
    individualAssignments.forEach((individualAssignment) => {
      const document = userMap.get(individualAssignment.user.id);
      if (document) {
        document.conditionId = individualAssignment.condition.id;
        userMap.set(individualAssignment.user.id, document);
      }
    });
    return Array.from(userMap.values());
  }

  public async getCSVData(experimentId: string): Promise<any> {
    const experiment = await this.experimentRepository.findOne({
      where: { id: experimentId },
      relations: ['partitions', 'conditions'],
    });

    if (!experiment) {
      return {};
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
    const individualAssignments: IndividualAssignment[] = promiseData[1] as any;
    const individualExclusions: IndividualExclusion[] = promiseData[2] as any;
    const groupAssignments: GroupAssignment[] = promiseData[3] as any;
    const groupExclusions: GroupExclusion[] = promiseData[4] as any;

    const data = this.getStatsData(
      experiment,
      monitoredExperimentPoints,
      individualAssignments,
      individualExclusions,
      groupAssignments,
      groupExclusions
    );

    console.log('data', data);
    return {};
  }

  private getStatsData(
    experiment: Experiment,
    monitoredExperimentPoints: MonitoredExperimentPoint[],
    individualAssignmentsOriginal: IndividualAssignment[],
    individualExclusions: IndividualExclusion[],
    groupAssignmentsOriginal: GroupAssignment[],
    groupExclusions: GroupExclusion[]
  ): IExperimentEnrollmentStats {
    // filter individual assignment
    const individualAssignments = individualAssignmentsOriginal.filter((individualAssignment) => {
      const user = individualAssignment.user.id;
      const exist = monitoredExperimentPoints.find((monitoredExperimentPoint) => {
        return monitoredExperimentPoint.user.id === user;
      });
      return exist ? true : false;
    });

    // filter group assignments
    const groupAssignments = groupAssignmentsOriginal.filter((groupAssignment) => {
      const groupId = groupAssignment.groupId;
      const exist = individualAssignments.find((individualAssignment) => {
        const workingGroupId = individualAssignment.user.workingGroup[experiment.group];
        return workingGroupId === groupId;
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
                  mappedUserDefinition.get(monitoredPoint.user.id).workingGroup[experiment.group]
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
                (monitoredPoint) => mappedUserDefinition.get(monitoredPoint.user.id).workingGroup[experiment.group]
              )
            )
          )) ||
        [];

      // condition
      const conditions = experiment.conditions.map((condition) => {
        const conditionAssignedUser = usersPartitionIncluded.filter((userPartition) => {
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
                  (monitoredPoint) => mappedUserDefinition.get(monitoredPoint.user.id).workingGroup[experiment.group]
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
    };
  }
}
