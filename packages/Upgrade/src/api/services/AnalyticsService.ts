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
import { IExperimentDateStat } from 'upgrade_types';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { GroupAssignment } from '../models/GroupAssignment';
import { GroupExclusion } from '../models/GroupExclusion';
import { ASSIGNMENT_TYPE } from '../../types';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';

enum EXPERIMENT_ELEMENTS {
  EXPERIMENT_INFORMATION = 'Experiment Information',
  EXPERIMENT_CONDITIONS = 'Experiment Conditions',
  EXPERIMENT_PARTITIONS = 'Experiment Partitions',
  MARKED_EXPERIMENT_POINT = 'Marked Experiment Point',
  EXPERIMENT_INDIVIDUAL_EXCLUSION = 'Experiment Individual Exclusion',
  EXPERIMENT_GROUP_EXCLUSION = 'Experiment Group Exclusion',
  EXPERIMENT_INDIVIDUAL_ASSIGNMENT = 'Experiment Individual Assignments',
  EXPERIMENT_GROUP_ASSIGNMENTS = 'Experiment Group Assignments',
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
    private groupAssignmentRepository: GroupAssignmentRepository,
    @OrmRepository()
    private analyticsRepository: AnalyticsRepository
  ) {}

  public async getEnrollments(experimentIds: string[]): Promise<any> {
    return this.analyticsRepository.getEnrollments(experimentIds);
  }

  public async getDetailEnrolment(experimentId: string, from: Date, to: Date): Promise<any> {
    const [
      individualEnrollment,
      groupEnrollment,
      individualExclusion,
      groupExclusion,
    ] = await this.analyticsRepository.getDetailEnrollment(experimentId, from, to);

    // total individual users
    const userIds: string[] = individualEnrollment.map((enrollment) => enrollment.userId);
    const uniqueUsers = new Set(userIds);
    const totalUsers = uniqueUsers.size;

    // total groups
    const groupIds: string[] = groupEnrollment.map((enrollment) => enrollment.groupId);
    const uniqueGroups = new Set(groupIds);
    const totalGroups = uniqueGroups.size;

    const returningData = {
      users: totalUsers,
      groups: totalGroups,
      usersExcluded: parseInt(individualExclusion[0].count, 10),
      groupsExcluded: parseInt(groupExclusion[0].count, 10),
      partitions: {},
      conditions: {},
    };

    // populate individual user data
    individualEnrollment.forEach(({ conditions_id, partitions_id }) => {
      // initializing partitionIds
      returningData.partitions[partitions_id] = returningData.partitions[partitions_id] || {
        users: 0,
        groups: 0,
        conditions: {},
      };
      // console.log('returningData.partitions[partitions_id]', returningData.partitions[partitions_id]);
      returningData.partitions[partitions_id].users++;

      returningData.partitions[partitions_id].conditions[conditions_id] = returningData.partitions[partitions_id]
        .conditions[conditions_id] || { users: 0, groups: 0 };

      returningData.partitions[partitions_id].conditions[conditions_id].users++;

      // initializing conditionIds
      returningData.conditions[conditions_id] = returningData.conditions[conditions_id] || {
        users: 0,
        groups: 0,
        partitions: {},
      };
      returningData.conditions[conditions_id].users++;

      returningData.conditions[conditions_id].partitions[partitions_id] = returningData.conditions[conditions_id]
        .partitions[partitions_id] || { users: 0, groups: 0 };

      returningData.conditions[conditions_id].partitions[partitions_id].users++;
    });

    // populate group data
    groupEnrollment.forEach(({ conditions_id, partitions_id }) => {
      // initializing partitionIds
      returningData.partitions[partitions_id] = returningData.partitions[partitions_id] || {
        users: 0,
        groups: 0,
        conditions: {},
      };
      returningData.partitions[partitions_id].groups++;

      returningData.partitions[partitions_id].conditions[conditions_id] = returningData.partitions[partitions_id]
        .conditions[conditions_id] || { users: 0, groups: 0 };

      returningData.partitions[partitions_id].conditions[conditions_id].groups++;

      // initializing conditionIds
      returningData.conditions[conditions_id] = returningData.partitions[partitions_id] || {
        users: 0,
        groups: 0,
        partitions: {},
      };
      returningData.conditions[conditions_id].groups++;

      returningData.conditions[conditions_id].partitions[partitions_id] = returningData.conditions[conditions_id]
        .partitions[partitions_id] || { users: 0, groups: 0 };

      returningData.conditions[conditions_id].partitions[partitions_id].groups++;
    });

    return returningData;
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
      this.individualAssignmentRepository.findIndividualAssignmentsByExperimentIdAndAlgorithm(
        experimentId,
        ASSIGNMENT_TYPE.ALGORITHMIC
      ),
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
      const createdAt = document
        ? { [monitoredExperimentPoint.experimentId]: monitoredExperimentPoint.createdAt, ...document.createdAt }
        : { [monitoredExperimentPoint.experimentId]: monitoredExperimentPoint.createdAt };
      userMap.set(monitoredExperimentPoint.user.id, {
        userId: monitoredExperimentPoint.user.id,
        groupId: experiment.group ? userGroup : undefined,
        partitionIds: document
          ? [...document.partitionIds, monitoredExperimentPoint.experimentId]
          : [monitoredExperimentPoint.experimentId],
        conditionId: 'default',
        createdAt,
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
      this.individualAssignmentRepository.findIndividualAssignmentsByExperimentIdAndAlgorithm(
        experimentId,
        ASSIGNMENT_TYPE.ALGORITHMIC
      ),
      this.groupAssignmentRepository.findGroupAssignmentsByExperimentId(experimentId),
    ]);

    const monitoredExperimentPoints: MonitoredExperimentPoint[] = promiseData[0] as any;
    const individualExclusions: IndividualExclusion[] = promiseData[1] as any;
    const groupExclusions: GroupExclusion[] = promiseData[2] as any;
    const individualAssignments: IndividualAssignment[] = promiseData[3] as any;
    const groupAssignments: GroupAssignment[] = promiseData[4] as any;
    const csvRows = [];

    const csvRowFormat = {
      experimentElement: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      versionNumber: undefined,
      id: undefined,
      name: undefined,
      experimentDescription: undefined,
      context: undefined,
      state: undefined,
      experimentStartOn: undefined,
      consistencyRule: undefined,
      assignmentUnit: undefined,
      postExperimentRule: undefined,
      enrollmentCompleteCondition: undefined,
      experimentEndOn: undefined,
      revertTo: undefined,
      tags: undefined,
      group: undefined,
      twoCharacterId: undefined,
      conditionName: undefined,
      conditionDescription: undefined,
      conditionCode: undefined,
      assignmentWeight: undefined,
      expPoint: undefined,
      expId: undefined,
      partitionDescription: undefined,
      experimentId: undefined,
      groupId: undefined,
      userId: undefined,
      userGroup: undefined,
      userWorkingGroup: undefined,
      assignmentType: undefined,
      conditionId: undefined,
    };

    // Add experiment Information
    const experimentRow = {
      ...csvRowFormat,
      experimentElement: EXPERIMENT_ELEMENTS.EXPERIMENT_INFORMATION,
      createdAt: experimentInfo.createdAt,
      updatedAt: experimentInfo.updatedAt,
      versionNumber: experimentInfo.versionNumber,
      id: experimentInfo.id,
      name: experimentInfo.name,
      experimentDescription: experimentInfo.description,
      context: experimentInfo.context,
      state: experimentInfo.state,
      experimentStartOn: experimentInfo.startOn,
      consistencyRule: experimentInfo.consistencyRule,
      assignmentUnit: experimentInfo.assignmentUnit,
      postExperimentRule: experimentInfo.postExperimentRule,
      enrollmentCompleteCondition: experimentInfo.enrollmentCompleteCondition
        ? JSON.stringify(experimentInfo.enrollmentCompleteCondition)
        : '',
      experimentEndOn: experimentInfo.endOn,
      revertTo: experimentInfo.revertTo,
      tags: experimentInfo.tags,
      group: experimentInfo.group,
    };
    csvRows.push(experimentRow);

    // Add conditions
    conditions.forEach((condition) => {
      const conditionRow = {
        ...experimentRow,
        experimentElement: EXPERIMENT_ELEMENTS.EXPERIMENT_CONDITIONS,
        createdAt: condition.createdAt,
        updatedAt: condition.updatedAt,
        versionNumber: condition.versionNumber,
        id: condition.id,
        twoCharacterId: condition.twoCharacterId,
        conditionName: condition.name,
        conditionCode: condition.conditionCode,
        conditionDescription: condition.description,
        assignmentWeight: condition.assignmentWeight,
      };
      csvRows.push(conditionRow);
    });

    // Add partitions
    partitions.forEach((partition) => {
      const partitionRow = {
        ...experimentRow,
        experimentElement: EXPERIMENT_ELEMENTS.EXPERIMENT_PARTITIONS,
        createdAt: partition.createdAt,
        updatedAt: partition.updatedAt,
        versionNumber: partition.versionNumber,
        id: partition.id,
        twoCharacterId: partition.twoCharacterId,
        expPoint: partition.expPoint,
        expId: partition.expId,
        partitionDescription: partition.description,
      };
      csvRows.push(partitionRow);
    });

    // Add marked experiment points
    if (monitoredExperimentPoints.length) {
      monitoredExperimentPoints.map((monitoredPoint) => {
        const monitoredPointRow = {
          ...experimentRow,
          experimentElement: EXPERIMENT_ELEMENTS.MARKED_EXPERIMENT_POINT,
          createdAt: monitoredPoint.createdAt,
          updatedAt: monitoredPoint.updatedAt,
          versionNumber: monitoredPoint.versionNumber,
          id: monitoredPoint.id,
          experimentId: monitoredPoint.experimentId,
          userId: monitoredPoint.user.id,
          userGroup: monitoredPoint.user.group ? JSON.stringify(monitoredPoint.user.group) : '',
          userWorkingGroup: monitoredPoint.user.workingGroup ? JSON.stringify(monitoredPoint.user.workingGroup) : '',
        };
        csvRows.push(monitoredPointRow);
      });
    }

    // Add individual exclusions
    if (individualExclusions.length) {
      individualExclusions.map((individualExclusion) => {
        const individualExclusionRow = {
          ...experimentRow,
          experimentElement: EXPERIMENT_ELEMENTS.EXPERIMENT_INDIVIDUAL_EXCLUSION,
          createdAt: individualExclusion.createdAt,
          updatedAt: individualExclusion.updatedAt,
          versionNumber: individualExclusion.versionNumber,
          id: individualExclusion.id,
          experimentId: individualExclusion.experiment.id,
          userId: individualExclusion.user.id,
          userGroup: individualExclusion.user.group ? JSON.stringify(individualExclusion.user.group) : '',
          userWorkingGroup: individualExclusion.user.workingGroup
            ? JSON.stringify(individualExclusion.user.workingGroup)
            : '',
        };
        csvRows.push(individualExclusionRow);
      });
    }

    // Add group exclusion
    if (groupExclusions.length) {
      groupExclusions.map((groupExclusion) => {
        const groupExclusionRow = {
          ...experimentRow,
          experimentElement: EXPERIMENT_ELEMENTS.EXPERIMENT_GROUP_EXCLUSION,
          createdAt: groupExclusion.createdAt,
          updatedAt: groupExclusion.updatedAt,
          versionNumber: groupExclusion.versionNumber,
          id: groupExclusion.id,
          experimentId: groupExclusion.experiment.id,
          groupId: groupExclusion.groupId,
        };
        csvRows.push(groupExclusionRow);
      });
    }

    // Add individual assignments
    if (individualAssignments.length) {
      individualAssignments.map((assignment) => {
        const assignmentRow = {
          ...experimentRow,
          experimentElement: EXPERIMENT_ELEMENTS.EXPERIMENT_INDIVIDUAL_ASSIGNMENT,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt,
          versionNumber: assignment.versionNumber,
          id: assignment.id,
          experimentId: assignment.experiment.id,
          conditionId: assignment.condition.id,
          assignmentType: assignment.assignmentType,
          userId: assignment.user.id,
          userGroup: assignment.user.group ? JSON.stringify(assignment.user.group) : '',
          userWorkingGroup: assignment.user.workingGroup ? JSON.stringify(assignment.user.workingGroup) : '',
        };
        csvRows.push(assignmentRow);
      });
    }

    // Add group assignments
    if (groupAssignments.length) {
      groupAssignments.map((assignment) => {
        const assignmentRow = {
          ...experimentRow,
          experimentElement: EXPERIMENT_ELEMENTS.EXPERIMENT_GROUP_ASSIGNMENTS,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt,
          versionNumber: assignment.versionNumber,
          id: assignment.id,
          experimentId: assignment.experiment.id,
          conditionId: assignment.condition.id,
          groupId: assignment.groupId,
        };
        csvRows.push(assignmentRow);
      });
    }
    return this.convertArrayToCsvForm(csvRows);
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
        .map((row) => {
          return keys
            .map((k) => {
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
