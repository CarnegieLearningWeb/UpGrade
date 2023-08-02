import { LogRepository } from './../repositories/LogRepository';
import { ErrorWithType } from './../errors/ErrorWithType';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { AWSService } from './AWSService';
import {
  IExperimentEnrollmentDetailStats,
  DATE_RANGE,
  IExperimentEnrollmentDetailDateStats,
  EXPERIMENT_LOG_TYPE,
  REPEATED_MEASURE,
  IMetricMetaData,
  ASSIGNMENT_UNIT,
  EXPERIMENT_TYPE,
} from 'upgrade_types';
import { AnalyticsRepository, CSVExportDataRow } from '../repositories/AnalyticsRepository';
import { Experiment } from '../models/Experiment';
import ObjectsToCsv from 'objects-to-csv';
import fs from 'fs';
import { SERVER_ERROR, IExperimentEnrollmentStats } from 'upgrade_types';
import { env } from '../../env';
import { ErrorService } from './ErrorService';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { UserRepository } from '../repositories/UserRepository';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { METRICS_JOIN_TEXT } from './MetricService';
import { getCustomRepository } from 'typeorm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

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
    @OrmRepository()
    private logRepository: LogRepository,
    public awsService: AWSService,
    public errorService: ErrorService
  ) {}

  public async getEnrollments(experimentIds: string[]): Promise<IExperimentEnrollmentStats[]> {
    return this.analyticsRepository.getEnrollments(experimentIds);
  }

  public async getDetailEnrollment(experimentId: string): Promise<IExperimentEnrollmentDetailStats> {
    return this.analyticsRepository.getEnrollmentPerPartitionCondition(experimentId);
  }

  public async getEnrollmentStatsByDate(
    experimentId: string,
    dateRange: DATE_RANGE,
    clientOffset: number
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
    const [individualEnrollmentConditionAndDecisionPoint, groupEnrollmentConditionAndDecisionPoint] = promiseArray[1];

    return Object.keys(keyToReturn).map((date) => {
      const stats: IExperimentEnrollmentDetailDateStats = {
        id: experimentId,
        conditions: experiment
          ? experiment.conditions.map(({ id }) => {
              return {
                id,
                partitions: experiment.partitions.map((decisionPointDoc) => {
                  const userInConditionDecisionPoint = individualEnrollmentConditionAndDecisionPoint.find(
                    ({ conditionId, partitionId, date_range }) => {
                      return (
                        partitionId === decisionPointDoc.id &&
                        conditionId === id &&
                        new Date(date).getTime() === (date_range as any).getTime()
                      );
                    }
                  );
                  const groupInConditionDecisionPoint = groupEnrollmentConditionAndDecisionPoint.find(
                    ({ conditionId, partitionId, date_range }) => {
                      return (
                        partitionId === decisionPointDoc.id &&
                        conditionId === id &&
                        new Date(date).getTime() === (date_range as any).getTime()
                      );
                    }
                  );
                  return {
                    id: decisionPointDoc.id,
                    users: (userInConditionDecisionPoint && userInConditionDecisionPoint.count) || 0,
                    groups: (groupInConditionDecisionPoint && groupInConditionDecisionPoint.count) || 0,
                  };
                }),
              };
            })
          : [],
      };
      return {
        date,
        stats,
      };
    });
  }

  public async getCSVData(experimentId: string, email: string, logger: UpgradeLogger): Promise<string> {
    logger.info({ message: `Inside getCSVData ${experimentId} , ${email}` });
    try {
      const timeStamp = new Date().toISOString();
      const folderPath = 'src/api/assets/files/';
      // create the directory if not exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const simpleExportCSV = `${email}_simpleExport${timeStamp}.csv`;

      const userRepository: UserRepository = getCustomRepository(UserRepository, 'export');
      const [experiment, user] = await Promise.all([
        this.experimentRepository.findOne({
          where: { id: experimentId },
        }),
        userRepository.findOne({ email }),
      ]);

      // make new query here
      let toLoop = true;
      let skip = 0;
      const take = 50;
      do {
        let csvExportData: CSVExportDataRow[];
        if(experiment.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS) {
          csvExportData = await this.analyticsRepository.getCSVDataForWithInSubExport(experimentId, skip, take);
        }else {
          csvExportData = await this.analyticsRepository.getCSVDataForSimpleExport(experimentId, skip, take);
        }
        const userIds = csvExportData.map(({ userId }) => userId);
        // don't query if no data
        if (!experimentId || (userIds && userIds.length === 0)) {
          break;
        }
        const queryData = await this.logRepository.getLogPerExperimentQueryForUser(experimentId, userIds);

        // query name id mapping
        const queryNameIdMapping: Record<string, string> = {};
        queryData.forEach((singleRecord) => {
          queryNameIdMapping[singleRecord.id] = singleRecord.name;
        });

        type queryDataArrayType = typeof queryData;
        type queryDataType = queryDataArrayType[0];

        // filter and group data according to repeated measure
        const groupedUser: Record<string, Record<string, queryDataType[]>> = {};
        // group data according to user and query id
        queryData.forEach((individualData) => {
          groupedUser[individualData.userId] = groupedUser[individualData.userId] || {};
          groupedUser[individualData.userId][individualData.id] =
            groupedUser[individualData.userId][individualData.id] || [];
          groupedUser[individualData.userId][individualData.id].push(individualData);
        });

        const logsUser: Record<string, Record<string, any>> = {};
        // fix repeated measure
        for (const userId in groupedUser) {
          if (!groupedUser[userId]) {
            continue;
          }
          for (const queryId in groupedUser[userId]) {
            if (groupedUser[userId][queryId].length > 0) {
              const repeatedMeasure = groupedUser[userId][queryId][0].repeatedMeasure;
              const key = groupedUser[userId][queryId][0].key;
              const type = groupedUser[userId][queryId][0].type;

              const keySplitArray = key.split(METRICS_JOIN_TEXT);
              logsUser[userId] = logsUser[userId] || {};
              logsUser[userId][queryId] = logsUser[userId][queryId] || {};
              switch (repeatedMeasure) {
                case REPEATED_MEASURE.earliest: {
                  const jsonLog = groupedUser[userId][queryId].reduce(
                    (accumulator: queryDataType | undefined, doc: queryDataType) => {
                      if (accumulator) {
                        return new Date(accumulator.updatedAt) > new Date(doc.updatedAt) ? doc : accumulator;
                      }
                      return doc;
                    },
                    undefined
                  ).data;
                  if (type === IMetricMetaData.CONTINUOUS) {
                    logsUser[userId][queryId] = +keySplitArray.reduce(
                      (accumulator, attribute: string) => accumulator[attribute],
                      jsonLog
                    );
                  } else {
                    logsUser[userId][queryId] = keySplitArray.reduce(
                      (accumulator, attribute: string) => accumulator[attribute],
                      jsonLog
                    );
                  }
                  break;
                }
                case REPEATED_MEASURE.mostRecent: {
                  const jsonLog = groupedUser[userId][queryId].reduce(
                    (accumulator: queryDataType | undefined, doc: queryDataType) => {
                      if (accumulator) {
                        return new Date(accumulator.updatedAt) < new Date(doc.updatedAt) ? doc : accumulator;
                      }
                      return doc;
                    },
                    undefined
                  ).data;
                  if (type === IMetricMetaData.CONTINUOUS) {
                    logsUser[userId][queryId] = +keySplitArray.reduce(
                      (accumulator, attribute: string) => accumulator[attribute],
                      jsonLog
                    );
                  } else {
                    logsUser[userId][queryId] = keySplitArray.reduce(
                      (accumulator, attribute: string) => accumulator[attribute],
                      jsonLog
                    );
                  }
                  break;
                }
                default: {
                  const totalSum = groupedUser[userId][queryId].reduce((accumulator: number, doc: queryDataType) => {
                    return (
                      accumulator + +keySplitArray.reduce((total, attribute: string) => total[attribute], doc.data)
                    );
                  }, 0);
                  logsUser[userId][queryId] = totalSum / groupedUser[userId][queryId].length;
                  break;
                }
              }
            }
          }
        }

        // merge with data
        const csvRows = csvExportData.map((row) => {
          const queryObject = logsUser[row.userId];
          const queryDataToAdd = {};

          for (const queryId in queryObject) {
            if (queryObject[queryId]) {
              queryDataToAdd[queryNameIdMapping[queryId]] = queryObject[queryId];
            }
          }

          return {
            ExperimentId: row.experimentId,
            ExperimentName: row.experimentName,
            UserId: row.userId,
            AppContext: row.context[0],
            UnitOfAssignment: row.assignmentUnit,
            GroupType: row.group,
            GroupId: row.groupId,
            Site: row.site,
            Target: row.target,
            ConditionName: row.conditionName,
            FirstDecisionPointReachedOn: new Date(row.firstDecisionPointReachedOn).toISOString(),
            UniqueDecisionPointsMarked: row.decisionPointReachedCount,
            ...queryDataToAdd,
          };
        });

        // write in the file
        const csv = new ObjectsToCsv(csvRows);
        try {
          if (experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
            csv.delimiter = ',';
          }
          await csv.toDisk(`${folderPath}${simpleExportCSV}`, { append: true });
        } catch (err) {
          console.log(err);
        }

        if (csvExportData.length === take) {
          skip += take;
        } else {
          toLoop = false;
        }
      } while (toLoop);

      const email_export = env.email.emailBucket;
      const email_expiry_time = env.email.expireAfterSeconds;
      const email_from = env.email.from;

      const fileName = `${folderPath}${simpleExportCSV}`;
      if (!fs.existsSync(fileName)) {
        // if file doesn't exist create a empty file
        const csvRows = [
          {
            ExperimentId: '',
            ExperimentName: '',
            UserId: '',
            GroupId: '',
            ConditionName: '',
            FirstDecisionPointReachedOn: '',
          },
        ];
        const csv = new ObjectsToCsv(csvRows);
        await csv.toDisk(`${folderPath}${simpleExportCSV}`, { append: true });
      }

      const monitorFileBuffer = fs.readFileSync(fileName);
      // delete local file copy:
      fs.unlinkSync(`${folderPath}${simpleExportCSV}`);

      await Promise.all([this.awsService.uploadCSV(monitorFileBuffer, email_export, simpleExportCSV)]);

      const signedURLMonitored = await Promise.all([
        this.awsService.generateSignedURL(email_export, simpleExportCSV, email_expiry_time),
      ]);

      const emailText = `Hey,
      <br>
      Here is the exported experiment data:
      <br>
      <a href="${signedURLMonitored[0]}">Monitored Experiment Data</a>`;

      const emailSubject = `Exported Data for the experiment: ${experiment.name}`;
      // send email to the user
      logger.info({ message: `Sending export data email to ${email}` });
      await this.awsService.sendEmail(email_from, email, emailText, emailSubject);
      await this.experimentAuditLogRepository.saveRawJson(
        EXPERIMENT_LOG_TYPE.EXPERIMENT_DATA_EXPORTED,
        { experimentName: experiment.name },
        user
      );
      logger.info({ message: `Exported Data emailed successfully to ${email}` });
    } catch (err) {
      const error = err as ErrorWithType;
      error.type = SERVER_ERROR.EMAIL_SEND_ERROR;
      logger.error({ message: `Export Data email unsuccessful:`, details: error });
      throw error;
    }

    logger.info({ message: 'Completing experiment data export' });

    return '';
  }
}
