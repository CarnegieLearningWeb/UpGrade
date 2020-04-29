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
          this.individualAssignmentRepository.findIndividualAssignmentsByExperimentId(experimentId),
          this.individualExclusionRepository.findExcludedByExperimentId(experimentId),
          this.groupAssignmentRepository.findGroupAssignmentsByExperimentId(experimentId),
          this.groupExclusionRepository.findExcludedByExperimentId(experimentId),
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
      this.individualAssignmentRepository.findIndividualAssignmentsByExperimentId(experimentId),
      this.individualExclusionRepository.findExcludedByExperimentId(experimentId),
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

  public async getCSVData(experimentId: string): Promise<string> {
    // get experiment definition
    const experiment = await this.experimentRepository.findOne({
      where: { id: experimentId },
      relations: ['partitions', 'conditions'],
    });

    if (!experiment) {
      return '';
    }

    const { conditions, partitions, ...experimentInfo } = experiment;

    const experimentIdAndPoint = [];
    partitions.forEach((partition) => {
      const partitionId = partition.id;
      experimentIdAndPoint.push(partitionId);
    });

    const promiseData = await Promise.all([
      this.monitoredExperimentPointRepository.find({
        where: { experimentId: In(experimentIdAndPoint) },
        relations: ['user'],
      }),
      this.individualExclusionRepository.findExcludedByExperimentId(experimentId),
      this.groupExclusionRepository.findExcludedByExperimentId(experimentId),
      this.individualAssignmentRepository.findIndividualAssignmentsByExperimentId(experimentId),
      this.groupAssignmentRepository.findGroupAssignmentsByExperimentId(experimentId),
    ]);

    let monitoredExperimentPoints: MonitoredExperimentPoint[] = promiseData[0] as any;
    let individualExclusions: IndividualExclusion[] = promiseData[1] as any;
    let groupExclusions: GroupExclusion[] = promiseData[2] as any;
    let individualAssignments: IndividualAssignment[] = promiseData[3] as any;
    let groupAssignments: GroupAssignment[] = promiseData[4] as any;
    const mappedUserDefinition = new Map<string, ExperimentUser>();

    // get user definition
    monitoredExperimentPoints.map((monitoredPoint) => {
      const user = this.getConvertedUserInfo(monitoredPoint.user);
      mappedUserDefinition.set(user.id, user);
    });
    individualExclusions.map(individualExclusion => {
      if (!mappedUserDefinition.has(individualExclusion.user.id)) {
        const user = this.getConvertedUserInfo(individualExclusion.user);
        mappedUserDefinition.set(user.id, user);
      }
    });
    individualAssignments.map(assignment => {
      if (!mappedUserDefinition.has(assignment.user.id)) {
        const user = this.getConvertedUserInfo(assignment.user);
        mappedUserDefinition.set(user.id, user);
      }
    });

    const userDefinition = Array.from(mappedUserDefinition.values());
    let csvData = '';
    const tableHeadings = [
      'Experiment Information',
      'Experiment Conditions',
      'Experiment Partitions',
      'Monitor Experiment Point',
      'Experiment Individual Exclusion',
      'Experiment Group Exclusion',
      'Experiment Individual Assignments',
      'Experiment Group Assignments',
      'Experiment Users',
    ];
    // Experiment Information
    csvData += tableHeadings[0] + '\r\n\n';
    csvData += this.convertArrayToCsvForm([experimentInfo]);

    // Experiment Conditions
    csvData += tableHeadings[1] + '\r\n\n';
    csvData += this.convertArrayToCsvForm(conditions);

    // Experiment Partitions
    csvData += tableHeadings[2] + '\r\n\n';
    csvData += this.convertArrayToCsvForm(partitions);

    // Experiment Monitor Points
    csvData += tableHeadings[3] + '\r\n\n';
    if (monitoredExperimentPoints.length) {
      monitoredExperimentPoints = monitoredExperimentPoints.map(monitoredPoint => {
        const data = {
          ...monitoredPoint,
          userId: monitoredPoint.user.id,
        };
        delete data.user;
        return data;
      });
    }
    csvData += this.convertArrayToCsvForm(monitoredExperimentPoints);

    // Experiment Individual Exclusions
    csvData += tableHeadings[4] + '\r\n\n';
    if (individualExclusions.length) {
      individualExclusions = individualExclusions.map(individualExclusion => {
        const data = {
          ...individualExclusion,
          experimentId: individualExclusion.experiment.id,
          userId: individualExclusion.user.id,
        };
        delete data.user;
        delete data.experiment;
        return data;
      });
    }
    csvData += this.convertArrayToCsvForm(individualExclusions);

    // Experiment Group Exclusions
    csvData += tableHeadings[5] + '\r\n\n';
    if (groupExclusions.length) {
      groupExclusions = groupExclusions.map(groupExclusion => {
        const data = {
          ...groupExclusion,
          experimentId: groupExclusion.experiment.id,
        };
        delete data.experiment;
        return data;
      });
    }
    csvData += this.convertArrayToCsvForm(groupExclusions);

    // Experiment Individual Assignments
    csvData += tableHeadings[6] + '\r\n\n';
    if (individualAssignments.length) {
      individualAssignments = individualAssignments.map(assignment => {
        const data = {
          ...assignment,
          experimentId: assignment.experiment.id,
          userId: assignment.user.id,
          conditionId: assignment.condition.id,
        };
        delete data.experiment;
        delete data.user;
        delete data.condition;
        return data;
      });
    }
    csvData += this.convertArrayToCsvForm(individualAssignments);

    // Experiment Group Assignments
    csvData += tableHeadings[7] + '\r\n\n';
    if (groupAssignments.length) {
      groupAssignments = groupAssignments.map(assignment => {
        const data = {
          ...assignment,
          experimentId: assignment.experiment.id,
          conditionId: assignment.condition.id,
        };
        delete data.experiment;
        delete data.condition;
        return data;
      });
    }
    csvData += this.convertArrayToCsvForm(groupAssignments);

    // Experiment Users
    csvData += tableHeadings[8] + '\r\n\n';
    csvData += this.convertArrayToCsvForm(userDefinition);

    return csvData;
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

  private getConvertedUserInfo(user: ExperimentUser): any {
    user.workingGroup = user.workingGroup ? JSON.stringify(user.workingGroup) as any : '';
    user.group = user.group ? JSON.stringify(user.group) as any : '';
    return user;
  }

  private convertArrayToCsvForm(data: any[]): string {
    if (!data.length) {
      return 'No Data\n\n\n';
    }
    const keys = Object.keys(data[0]);
    const separator = ',';
    let csvData = '';
    csvData +=
      keys.join(separator) +
      '\n' +
      data
        .map(row => {
          return keys
            .map(k => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = this.wrapCellsContainingRestrictedCharactersInDoubleQuotes(cell);
              return cell;
            })
            .join(separator);
        })
        .join('\n');
    return csvData + '\n\n\n';
  }

  private wrapCellsContainingRestrictedCharactersInDoubleQuotes(cellValue: string): string {
    let cell = this.escapeDoubleQuotes(cellValue);
    if (cell.search(/("|,|\n)/g) >= 0) {
      cell = `"${cell}"`;
    }
    return cell;
  }

  private escapeDoubleQuotes(cell: string): string {
    return cell.toString().replace(/"/g, '""');
  }
}
