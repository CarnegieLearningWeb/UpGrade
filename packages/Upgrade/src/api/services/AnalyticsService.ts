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
import { IExperimentEnrollmentDetailStats, DATE_RANGE } from 'upgrade_types';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { GroupAssignment } from '../models/GroupAssignment';
import { GroupExclusion } from '../models/GroupExclusion';
import { ASSIGNMENT_TYPE } from '../../types';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { Experiment } from '../models/Experiment';

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

interface IEnrollmentStatByDate {
  date: string;
  stats: IExperimentEnrollmentDetailStats;
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

  public async getDetailEnrolment(experimentId: string): Promise<IExperimentEnrollmentDetailStats> {
    const promiseArray = await Promise.all([
      this.experimentRepository.findOne(experimentId, { relations: ['conditions', 'partitions'] }),
      this.analyticsRepository.getDetailEnrollment(experimentId),
    ]);
    const experiment: Experiment = promiseArray[0];
    const [
      individualEnrollmentByCondition,
      individualEnrollmentConditionAndPartition,
      groupEnrollmentByCondition,
      groupEnrollmentConditionAndPartition,
      individualExclusion,
      groupExclusion,
    ] = promiseArray[1];

    // console.log('individualEnrollmentByCondition', individualEnrollmentByCondition);
    // console.log('individualEnrollmentConditionAndPartition', individualEnrollmentConditionAndPartition);
    // console.log('groupEnrollmentByCondition', groupEnrollmentByCondition);
    // console.log('groupEnrollmentConditionAndPartition', groupEnrollmentConditionAndPartition);
    // console.log('individualExclusion', individualExclusion);
    // console.log('groupExclusion', groupExclusion);

    return {
      id: experimentId,
      users:
        individualEnrollmentByCondition.reduce((accumulator: number, { count }): number => {
          return accumulator + parseInt(count, 10);
        }, 0) || 0,
      groups:
        groupEnrollmentByCondition.reduce((accumulator: number, { count }): number => {
          return accumulator + parseInt(count, 10);
        }, 0) || 0,
      usersExcluded: parseInt(individualExclusion[0].count, 10) || 0,
      groupsExcluded: parseInt(groupExclusion[0].count, 10) || 0,
      conditions: experiment.conditions.map(({ id }) => {
        const userInCondition = individualEnrollmentByCondition.find(({ conditions_id }) => {
          return conditions_id === id;
        });
        const groupInCondition = groupEnrollmentByCondition.find(({ conditions_id }) => {
          return conditions_id === id;
        });
        return {
          id,
          users: (userInCondition && parseInt(userInCondition.count, 10)) || 0,
          groups: (groupInCondition && parseInt(groupInCondition.count, 10)) || 0,
          partitions: experiment.partitions.map((partitionDoc) => {
            const userInConditionPartition = individualEnrollmentConditionAndPartition.find(
              ({ conditions_id, partitions_id }) => {
                return partitions_id === partitionDoc.id && conditions_id === id;
              }
            );
            const groupInConditionPartition = groupEnrollmentConditionAndPartition.find(
              ({ conditions_id, partitions_id }) => {
                return partitions_id === partitionDoc.id && conditions_id === id;
              }
            );
            return {
              id: partitionDoc.id,
              users: (userInConditionPartition && parseInt(userInConditionPartition.count, 10)) || 0,
              groups: (groupInConditionPartition && parseInt(groupInConditionPartition.count, 10)) || 0,
            };
          }),
        };
      }),
    };
  }

  public async getEnrolmentStatsByDate(experimentId: string, dateRange: DATE_RANGE): Promise<IEnrollmentStatByDate[]> {
    const keyToReturn = {};
    switch (dateRange) {
      case DATE_RANGE.LAST_SEVEN_DAYS:
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setHours(0, 0, 0, 0);
          date.setDate(date.getDate() - i);
          const newDate = new Date(date).toISOString();
          keyToReturn[newDate] = {};
        }
        break;
      case DATE_RANGE.LAST_THREE_MONTHS:
        for (let i = 0; i < 3; i++) {
          const date = new Date();
          date.setHours(0, 0, 0, 0);
          date.setDate(1);
          date.setMonth(date.getMonth() - i);
          const newDate = new Date(date).toISOString();
          keyToReturn[newDate] = {};
        }
        break;
      case DATE_RANGE.LAST_SIX_MONTHS:
        for (let i = 0; i < 6; i++) {
          const date = new Date();
          date.setHours(0, 0, 0, 0);
          date.setDate(1);
          date.setMonth(date.getMonth() - i);
          const newDate = new Date(date).toISOString();
          keyToReturn[newDate] = {};
        }
        break;
      default:
        for (let i = 0; i < 12; i++) {
          const date = new Date();
          date.setHours(0, 0, 0, 0);
          date.setDate(1);
          date.setMonth(date.getMonth() - i);
          const newDate = new Date(date).toISOString();
          keyToReturn[newDate] = {};
        }
        break;
    }

    const promiseArray = await Promise.all([
      this.experimentRepository.findOne(experimentId, { relations: ['conditions', 'partitions'] }),
      this.analyticsRepository.getEnrolmentByDateRange(experimentId, dateRange),
    ]);

    const experiment: Experiment = promiseArray[0];
    const [
      individualEnrollmentByCondition,
      individualEnrollmentConditionAndPartition,
      groupEnrollmentByCondition,
      groupEnrollmentConditionAndPartition,
      individualExclusion,
      groupExclusion,
    ] = promiseArray[1];

    // console.log('individualEnrollmentByCondition', individualEnrollmentByCondition);
    // console.log('individualEnrollmentConditionAndPartition', individualEnrollmentConditionAndPartition);
    // console.log('groupEnrollmentByCondition', groupEnrollmentByCondition);
    // console.log('groupEnrollmentConditionAndPartition', groupEnrollmentConditionAndPartition);
    // console.log('individualExclusion', individualExclusion);
    // console.log('groupExclusion', groupExclusion);

    return Object.keys(keyToReturn).map((date) => {
      const stats: IExperimentEnrollmentDetailStats = {
        id: experimentId,
        users:
          individualEnrollmentByCondition.reduce((accumulator: number, { count, date_range }): number => {
            return accumulator + (new Date(date).getTime() === (date_range as any).getTime() ? parseInt(count, 10) : 0);
          }, 0) || 0,
        groups:
          groupEnrollmentByCondition.reduce((accumulator: number, { count }): number => {
            return accumulator + parseInt(count, 10);
          }, 0) || 0,
        usersExcluded: parseInt(individualExclusion[0].count, 10) || 0,
        groupsExcluded: parseInt(groupExclusion[0].count, 10) || 0,
        conditions: experiment.conditions.map(({ id }) => {
          const userInCondition = individualEnrollmentByCondition.find(({ conditions_id, date_range }) => {
            return conditions_id === id && new Date(date).getTime() === (date_range as any).getTime();
          });
          const groupInCondition = groupEnrollmentByCondition.find(({ conditions_id, date_range }) => {
            return conditions_id === id && new Date(date).getTime() === (date_range as any).getTime();
          });
          return {
            id,
            users: (userInCondition && parseInt(userInCondition.count, 10)) || 0,
            groups: (groupInCondition && parseInt(groupInCondition.count, 10)) || 0,
            partitions: experiment.partitions.map((partitionDoc) => {
              const userInConditionPartition = individualEnrollmentConditionAndPartition.find(
                ({ conditions_id, partitions_id, date_range }) => {
                  return (
                    partitions_id === partitionDoc.id &&
                    conditions_id === id &&
                    new Date(date).getTime() === (date_range as any).getTime()
                  );
                }
              );
              const groupInConditionPartition = groupEnrollmentConditionAndPartition.find(
                ({ conditions_id, partitions_id, date_range }) => {
                  return (
                    partitions_id === partitionDoc.id &&
                    conditions_id === id &&
                    new Date(date).getTime() === (date_range as any).getTime()
                  );
                }
              );
              return {
                id: partitionDoc.id,
                users: (userInConditionPartition && parseInt(userInConditionPartition.count, 10)) || 0,
                groups: (groupInConditionPartition && parseInt(groupInConditionPartition.count, 10)) || 0,
              };
            }),
          };
        }),
      };
      return {
        date,
        stats,
      };
    });
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
