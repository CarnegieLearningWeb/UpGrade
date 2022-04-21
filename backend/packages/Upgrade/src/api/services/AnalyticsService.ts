import { ErrorWithType } from './../errors/ErrorWithType';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { MonitoredExperimentPointRepository } from '../repositories/MonitoredExperimentPointRepository';
import { IndividualAssignmentRepository } from '../repositories/IndividualAssignmentRepository';
import { GroupAssignmentRepository } from '../repositories/GroupAssignmentRepository';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { AWSService } from './AWSService';
import { ExperimentUserRepository } from '../repositories/ExperimentUserRepository';
import {
  IExperimentEnrollmentDetailStats,
  DATE_RANGE,
  IExperimentEnrollmentDetailDateStats,
  POST_EXPERIMENT_RULE,
  ENROLLMENT_CODE,
  EXPERIMENT_LOG_TYPE,
  EXPERIMENT_STATE,
} from 'upgrade_types';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { Experiment } from '../models/Experiment';
import { ExperimentCondition } from '../models/ExperimentCondition';
import ObjectsToCsv from 'objects-to-csv';
import { MonitoredExperimentPointLogRepository } from '../repositories/MonitorExperimentPointLogRepository';
import { getCustomRepository, In } from 'typeorm';
import fs from 'fs';
import { SERVER_ERROR } from 'upgrade_types';
import { env } from '../../env';
import { METRICS_JOIN_TEXT } from './MetricService';
import { ErrorService } from './ErrorService';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { UserRepository } from '../repositories/UserRepository';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

interface IEnrollmentStatByDate {
  date: string;
  stats: IExperimentEnrollmentDetailDateStats;
}

@Service()
export class AnalyticsService {
  constructor(
    @OrmRepository()
    private experimentRepository: ExperimentRepository,
    @OrmRepository()
    private analyticsRepository: AnalyticsRepository,
    @OrmRepository()
    private experimentAuditLogRepository: ExperimentAuditLogRepository,
    public awsService: AWSService,
    public errorService: ErrorService,
  ) {}

  public async getEnrollments(experimentIds: string[], logger: UpgradeLogger): Promise<any> {
    return this.analyticsRepository.getEnrollments(experimentIds);
  }

  public async getDetailEnrollment(experimentId: string, logger: UpgradeLogger): Promise<IExperimentEnrollmentDetailStats> {
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

    logger.info({ message : 'individualEnrollmentByCondition', data: individualEnrollmentByCondition });
    logger.info({ message : 'individualEnrollmentConditionAndPartition', data: individualEnrollmentConditionAndPartition });
    logger.info({ message : 'groupEnrollmentByCondition', data: groupEnrollmentByCondition });
    logger.info({ message : 'groupEnrollmentConditionAndPartition', data: groupEnrollmentConditionAndPartition });
    logger.info({ message : 'individualExclusion', data: individualExclusion });
    logger.info({ message : 'groupExclusion', data: groupExclusion });

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

  public async getEnrollmentStatsByDate(
    experimentId: string,
    dateRange: DATE_RANGE,
    clientOffset: number, 
    logger: UpgradeLogger
  ): Promise<IEnrollmentStatByDate[]> {
    const keyToReturn = {};
    switch (dateRange) {
      case DATE_RANGE.LAST_SEVEN_DAYS:
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setTime(date.getTime() + (date.getTimezoneOffset() + clientOffset) * 60000);
          date.setDate(date.getDate() - i);
          const newDate = date.toDateString();
          keyToReturn[newDate] = {};
        }
        break;
      case DATE_RANGE.LAST_THREE_MONTHS:
        for (let i = 0; i < 3; i++) {
          const date = new Date();
          date.setTime(date.getTime() + (date.getTimezoneOffset() + clientOffset) * 60000);
          date.setDate(1);
          date.setMonth(date.getMonth() - i);
          const newDate = date.toDateString();
          keyToReturn[newDate] = {};
        }
        break;
      case DATE_RANGE.LAST_SIX_MONTHS:
        for (let i = 0; i < 6; i++) {
          const date = new Date();
          date.setTime(date.getTime() + (date.getTimezoneOffset() + clientOffset) * 60000);
          date.setDate(1);
          date.setMonth(date.getMonth() - i);
          const newDate = date.toDateString();
          keyToReturn[newDate] = {};
        }
        break;
      default:
        for (let i = 0; i < 12; i++) {
          const date = new Date();
          date.setTime(date.getTime() + (date.getTimezoneOffset() + clientOffset) * 60000);
          date.setDate(1);
          date.setMonth(date.getMonth() - i);
          const newDate = date.toDateString();
          keyToReturn[newDate] = {};
        }
        break;
    }

    const promiseArray = await Promise.all([
      this.experimentRepository.findOne(experimentId, { relations: ['conditions', 'partitions'] }),
      this.analyticsRepository.getEnrollmentByDateRange(experimentId, dateRange, clientOffset),
    ]);

    const experiment: Experiment = promiseArray[0];
    const [individualEnrollmentConditionAndPartition, groupEnrollmentConditionAndPartition] = promiseArray[1];

    // console.log('individualEnrollmentByCondition', individualEnrollmentByCondition);
    // console.log('individualEnrollmentConditionAndPartition', individualEnrollmentConditionAndPartition);
    // console.log('groupEnrollmentByCondition', groupEnrollmentByCondition);
    // console.log('groupEnrollmentConditionAndPartition', groupEnrollmentConditionAndPartition);
    // console.log('individualExclusion', individualExclusion);
    // console.log('groupExclusion', groupExclusion);

    return Object.keys(keyToReturn).map((date) => {
      const stats: IExperimentEnrollmentDetailDateStats = {
        id: experimentId,
        conditions: experiment.conditions.map(({ id }) => {
          return {
            id,
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

  public async getCSVData(experimentId: string, email: string, logger: UpgradeLogger): Promise<string> {
    logger.info({ message : `Inside getCSVData ${experimentId} , ${email}` });
    try {
      const timeStamp = new Date().toISOString();
      const folderPath = 'src/api/assets/files/';
      // create the directory if not exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const monitoredPointCSV = `${email}_monitoredPoints${timeStamp}.csv`;
      // get experiment definition
      const experiment = await this.experimentRepository.findOne({
        where: { id: experimentId },
        relations: ['partitions', 'conditions', 'stateTimeLogs'],
      });
      if (!experiment) {
        return '';
      }
      const userRepository: UserRepository = await getCustomRepository(UserRepository, 'export');
      const user = await userRepository.findOne({ email });
      this.experimentAuditLogRepository.saveRawJson(
        EXPERIMENT_LOG_TYPE.EXPERIMENT_DATA_REQUESTED,
        { experimentName: experiment.name },
        user
      );
      const { conditions, partitions, stateTimeLogs, ...experimentInfo } = experiment;
      const experimentIdAndPoint = [];
      partitions.forEach((partition) => {
        const partitionId = partition.id;
        experimentIdAndPoint.push(partitionId);
      });
      const individualAssignmentRepository: IndividualAssignmentRepository= await getCustomRepository(IndividualAssignmentRepository, 'export');
      const groupAssignmentRepository: GroupAssignmentRepository= await getCustomRepository(GroupAssignmentRepository, 'export');
      const monitoredExperimentPointRepository: MonitoredExperimentPointRepository= await getCustomRepository(MonitoredExperimentPointRepository, 'export');
      const promiseData = await Promise.all([
        individualAssignmentRepository.findIndividualAssignmentsByConditions(experimentId),
        groupAssignmentRepository.findGroupAssignmentsByConditions(experimentId),
        monitoredExperimentPointRepository.getMonitoredExperimentPointCount(experimentIdAndPoint),
      ]);

      let csvRows: any = [
        {
          'Created At': experimentInfo.createdAt.toISOString(),
          'Updated At': experimentInfo.updatedAt.toISOString(),
          'version Number': experimentInfo.versionNumber,
          'Experiment ID': experimentInfo.id,
          'Experiment Name': experimentInfo.name,
          'Experiment Description': experimentInfo.description,
          'Enrollment Start Date': stateTimeLogs
            .filter((state) => state.toState === EXPERIMENT_STATE.ENROLLING)
            .map((timelogs) => timelogs.timeLog)
            .join(','),
          'Enrollment End Date': stateTimeLogs
            .filter((state) => state.fromState === EXPERIMENT_STATE.ENROLLING)
            .map((timelogs) => timelogs.timeLog)
            .join(','),
          'Unit of Assignment': experimentInfo.assignmentUnit,
          'Consistency Rule': experimentInfo.consistencyRule,
          // tslint:disable-next-line:object-literal-key-quotes
          Group: experimentInfo.group,
          // tslint:disable-next-line: object-literal-key-quotes
          Tags: experimentInfo.tags.join(','),
          // tslint:disable-next-line: object-literal-key-quotes
          Context: experimentInfo.context.join(','),
          'Condition Names': conditions.map((condition) => condition.conditionCode).join(','),
          'Condition Weights': conditions.map((condition) => condition.assignmentWeight).join(','),
          'Condition UserNs': this.getConditionByCount(conditions, promiseData[0]),
          'Condition GroupNs': this.getConditionByCount(conditions, promiseData[1]),
          'Ending Criteria':
            experimentInfo.enrollmentCompleteCondition && JSON.stringify(experimentInfo.enrollmentCompleteCondition),
          'Post-Experiment Rule':
            experimentInfo.postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE
              ? experimentInfo.postExperimentRule
              : experimentInfo.revertTo
              ? 'revert ( ' + this.getConditionCode(conditions, experimentInfo.revertTo) + ' )'
              : 'revert (to default)',
          // tslint:disable-next-line: object-literal-key-quotes
          ExperimentPoints: partitions.map((partition) => partition.expPoint).join(','),
          // tslint:disable-next-line: object-literal-key-quotes
          ExperimentIDs: partitions.map((partition) => partition.expId).join(','),
        },
      ];

      logger.info({ message : 'Exporting Experiment Data' });
      let csv = new ObjectsToCsv(csvRows);
      const take = 50;
      for (let i = 1; i <= promiseData[2]; i = i + take) {
        csvRows = [];
        const monitoredExperimentPoints =
          await monitoredExperimentPointRepository.getMonitorExperimentPointForExport(
            i - 1,
            take,
            experimentIdAndPoint,
            experimentId,
            'export'
          );

        // merge all the data log
        const mergedMonitoredExperimentPoint = {};
        monitoredExperimentPoints.forEach(({ metric_key, logs_uniquifier, ...monitoredPoint }) => {
          const key = monitoredPoint.partition_expId
            ? `${monitoredPoint.partition_expId}_${monitoredPoint.partition_expPoint}_${monitoredPoint.user_id}`
            : `${monitoredPoint.partition_expPoint}_${monitoredPoint.user_id}`;
          // filter logs only which are tracked
          const metricToTrack = metric_key || ' ';
          const metricArray = metricToTrack.split(METRICS_JOIN_TEXT);
          let filteredLogs = monitoredPoint.logs_data;
          // tslint:disable-next-line:prefer-for-of
          for (let j = 0; j < metricArray.length; j++) {
            const metric = metricArray[j];
            if (filteredLogs && filteredLogs[metric]) {
              filteredLogs = filteredLogs[metric];
            } else {
              filteredLogs = null;
              break;
            }
          }
          const metricToTrackWithUniquifier =
            metricArray.length > 1 ? `${metricToTrack}${METRICS_JOIN_TEXT}${logs_uniquifier}` : metricToTrack;

          mergedMonitoredExperimentPoint[key] = mergedMonitoredExperimentPoint[key]
            ? {
                ...mergedMonitoredExperimentPoint[key],
                logs_data: filteredLogs
                  ? {
                      ...mergedMonitoredExperimentPoint[key].logs_data,
                      [metricToTrackWithUniquifier]: filteredLogs,
                    }
                  : { ...mergedMonitoredExperimentPoint[key].logs_data },
              }
            : {
                ...monitoredPoint,
                logs_data: filteredLogs ? { [metricToTrackWithUniquifier]: filteredLogs } : filteredLogs,
              };
        });

        // get all monitored experiment points ids
        const monitoredPointIds = monitoredExperimentPoints.map((monitoredPoint) =>
          monitoredPoint.partition_expId
            ? `${monitoredPoint.partition_expId}_${monitoredPoint.partition_expPoint}_${monitoredPoint.user_id}`
            : `${monitoredPoint.partition_expPoint}_${monitoredPoint.user_id}`
        );
        // query experiment user
        const experimentUsers = monitoredExperimentPoints.map((monitoredPoint) => monitoredPoint.user_id);
        const experimentUserSet = new Set(experimentUsers);
        const experimentUsersArray = Array.from(experimentUserSet);
        const experimentUserRepository: ExperimentUserRepository= await getCustomRepository(ExperimentUserRepository, 'export');
        const monitoredExperimentPointLogRepository: MonitoredExperimentPointLogRepository= await getCustomRepository(MonitoredExperimentPointLogRepository, 'export');
        const [monitoredLogDocuments, experimentUserDocuments] = await Promise.all([
          monitoredExperimentPointLogRepository
            .find({
              where: { monitoredExperimentPoint: { id: In(monitoredPointIds) } },
              relations: ['monitoredExperimentPoint'],
            })
            .catch((error) => {
              error.message = `Error while finding monitored experiment point logs document for export: ${error.message}`;
              error.type = SERVER_ERROR.QUERY_FAILED;
              logger.error(error);
              throw error;
            }),
          experimentUserRepository
            .find({
              where: { id: In(experimentUsersArray) },
            })
            .catch((error) => {
              error.message = `Error while finding experiment user document for export in experimentUserRepository: ${error.message}`;
              error.type = SERVER_ERROR.QUERY_FAILED;
              logger.error(error);
              throw error;
            }),
          ,
        ]);

        // mapping user to their id
        const experimentUserMap = {};
        experimentUserDocuments.forEach((document) => {
          experimentUserMap[document.id] = document;
        });

        // monitored Log Document
        const toLogDocument = monitoredLogDocuments.map((monitoredLogDocument) => {
          const {
            createdAt,
            updatedAt,
            monitoredExperimentPoint: { id },
          } = monitoredLogDocument;
          return { ...mergedMonitoredExperimentPoint[id], createdAt, updatedAt };
        });

        toLogDocument.forEach((data) => {
          let enrollmentCodeNum = 3;
          switch (data.enrollmentCode) {
            case ENROLLMENT_CODE.INCLUDED:
              enrollmentCodeNum = 0;
              break;
            case ENROLLMENT_CODE.PRIOR_EXPERIMENT_ENROLLING:
              enrollmentCodeNum = 1;
              break;
            case ENROLLMENT_CODE.STUDENT_EXCLUDED:
              enrollmentCodeNum = 2;
              break;
            case ENROLLMENT_CODE.GROUP_EXCLUDED:
              enrollmentCodeNum = 3;
              break;
            default:
              enrollmentCodeNum = 0;
              break;
          }
          csvRows.push({
            'Main Experiment Id': experimentId,
            // tslint:disable-next-line: object-literal-key-quotes
            UserId: data.user_id || '',
            // tslint:disable-next-line: object-literal-key-quotes
            markExperimentPointTime: data.createdAt.toISOString(),
            'Enrollment code': data.enrollmentCode,
            'Enrollment code number': enrollmentCodeNum,
            'Condition Name': data.conditions_conditionCode || 'default',
            // tslint:disable-next-line: object-literal-key-quotes
            GroupId:
              (experiment.group &&
                experimentUserMap[data.user_id] &&
                experimentUserMap[data.user_id].workingGroup &&
                experimentUserMap[data.user_id].workingGroup[experiment.group]) ||
              '',
            // tslint:disable-next-line: object-literal-key-quotes
            ExperimentPoint: data.partition_expPoint,
            // tslint:disable-next-line: object-literal-key-quotes
            ExperimentId: data.partition_expId,
            'Metrics monitored': data.logs_data == null ? '' : JSON.stringify(data.logs_data),
          });
        });
        csv = new ObjectsToCsv(csvRows);
        await csv.toDisk(`${folderPath}${monitoredPointCSV}`, { append: true });
      }
      const email_export = env.email.emailBucket;
      const email_expiry_time = env.email.expireAfterSeconds;
      const email_from = env.email.from;

      let monitorFileBuffer;
      let signedURLMonitored;

      let emailText;
      monitorFileBuffer = fs.readFileSync(`${folderPath}${monitoredPointCSV}`);
      // delete local file copy:
      fs.unlinkSync(`${folderPath}${monitoredPointCSV}`);

      await Promise.all([this.awsService.uploadCSV(monitorFileBuffer, email_export, monitoredPointCSV)]);

      signedURLMonitored = await Promise.all([
        this.awsService.generateSignedURL(email_export, monitoredPointCSV, email_expiry_time),
      ]);

      emailText = `Hey, 
      <br>
      Here is the exported experiment data:
      <br>
      <a href=\"${signedURLMonitored[0]}\">Monitored Experiment Data</a>`;

      const emailSubject = `Exported Data for the experiment: ${experiment.name}`;
      // send email to the user
      logger.info({ message: `Sending export data email to ${email}` });
      await this.awsService.sendEmail(email_from, email, emailText, emailSubject);
      this.experimentAuditLogRepository.saveRawJson(
        EXPERIMENT_LOG_TYPE.EXPERIMENT_DATA_EXPORTED,
        { experimentName: experimentInfo.name },
        user
      );
      logger.info({ message: `Exported Data emailed successfully to ${email}` });
    } catch (err) {
      const error = err as ErrorWithType;
      error.type = SERVER_ERROR.EMAIL_SEND_ERROR;
      logger.error({ message: `Export Data email unsuccessful:`, details: error });
      throw error;
    }

    logger.info({ message : 'Completing experiment data export' });

    return '';
  }

  private getConditionCode(conditions: ExperimentCondition[], id: string): string {
    return conditions.filter((condition) => condition.id === id)[0].conditionCode || '';
  }

  private getConditionByCount(conditions: ExperimentCondition[], data: any): string {
    return conditions
      .map((condition) => {
        const conditionFound = data.find((con) => (con as any).conditionId === condition.id);
        return conditionFound ? (conditionFound as any).count : 0;
      })
      .join(',');
  }
}
