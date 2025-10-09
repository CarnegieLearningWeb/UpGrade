import { LogRepository } from './../repositories/LogRepository';
import { ErrorWithType } from './../errors/ErrorWithType';
import { Service } from 'typedi';
import { InjectRepository, Container } from '../../typeorm-typedi-extensions';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { AWSService } from './AWSService';
import {
  IExperimentEnrollmentDetailStats,
  DATE_RANGE,
  IExperimentEnrollmentDetailDateStats,
  LOG_TYPE,
  REPEATED_MEASURE,
  IMetricMetaData,
  ASSIGNMENT_UNIT,
  SERVER_ERROR,
  IExperimentEnrollmentStats,
} from 'upgrade_types';
import { AnalyticsRepository, ExperimentDetailsForCSVData } from '../repositories/AnalyticsRepository';
import { Experiment } from '../models/Experiment';
import ObjectsToCsv from 'objects-to-csv';
import fs from 'fs';
import { env } from '../../env';
import { ErrorService } from './ErrorService';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { UserRepository } from '../repositories/UserRepository';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { METRICS_JOIN_TEXT } from './MetricService';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ExperimentService } from './ExperimentService';
import { QueryService } from './QueryService';
import { HttpError } from 'routing-controllers';

dayjs.extend(utc);
dayjs.extend(timezone);

interface IEnrollmentStatByDate {
  date: string;
  stats: IExperimentEnrollmentDetailDateStats;
}

@Service()
export class AnalyticsService {
  constructor(
    @InjectRepository()
    private experimentRepository: ExperimentRepository,
    @InjectRepository()
    private analyticsRepository: AnalyticsRepository,
    @InjectRepository()
    private experimentAuditLogRepository: ExperimentAuditLogRepository,
    @InjectRepository()
    private logRepository: LogRepository,
    public awsService: AWSService,
    public errorService: ErrorService,
    public experimentService: ExperimentService,
    public queryService: QueryService
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
      this.experimentRepository.findOne({ where: { id: experimentId }, relations: ['conditions', 'partitions'] }),
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

  public async exportCSVData(experimentId: string, email: string, logger: UpgradeLogger): Promise<void> {
    logger.info({ message: `Inside exportCSVData ${experimentId} , ${email}` });

    const experimentDetails: ExperimentDetailsForCSVData[] =
      await this.experimentService.getExperimentDetailsForCSVDataExport(experimentId);
    if (!experimentDetails || experimentDetails.length === 0) {
      throw new HttpError(404, `Experiment not found for id: ${experimentId}`);
    }

    this.sendExportData(experimentDetails, email, logger);
  }

  private async sendExportData(
    experimentDetails: ExperimentDetailsForCSVData[],
    email: string,
    logger: UpgradeLogger
  ): Promise<void> {
    try {
      const timeStamp = new Date().toISOString();
      const folderPath = 'src/api/assets/files/';
      // create the directory if not exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const simpleExportCSV = `${email}_simpleExport${timeStamp}.csv`;

      const userRepository: UserRepository = Container.getCustomRepository(UserRepository, 'export');
      const user = await userRepository.findOneBy({ email });
      const experimentMap = new Map<string, ExperimentDetailsForCSVData>();

      const formattedExperiment: ExperimentDetailsForCSVData[] = experimentDetails.reduce((acc, item) => {
        // if the experiment is not in the map, add it
        if (!experimentMap.has(item.experimentId)) {
          const experiment: ExperimentDetailsForCSVData = {
            experimentId: item.experimentId,
            experimentName: item.experimentName,
            context: item.context,
            assignmentUnit: item.assignmentUnit,
            group: item.group,
            consistencyRule: item.consistencyRule,
            designType: item.designType,
            algorithmType: item.algorithmType,
            stratification: item.stratification,
            postRule: item.postRule,
            enrollmentStartDate: item.enrollmentStartDate,
            enrollmentCompleteDate: item.enrollmentCompleteDate,
            conditionOrder: item.conditionOrder,
            details: [],
          };
          experimentMap.set(item.experimentId, experiment);
          acc.push(experiment);
        }
        // add the design details for the experiment for each experimentQueryResult item
        experimentMap.get(item.experimentId)?.details.push({
          expConditionId: item.expConditionId,
          conditionName: item.conditionName,
          revertTo: item.revertTo,
          payload: item.payload,
          excludeIfReached: item.excludeIfReached,
          expDecisionPointId: item.expDecisionPointId,
        });
        return acc;
      }, []);

      const csvExportData = await this.analyticsRepository.getCSVDataForExport(
        formattedExperiment[0],
        experimentDetails[0].experimentId
      );

      const queryData = await this.logRepository.getLogPerExperimentQuery(experimentDetails[0].experimentId);

      // create a map of query id to header
      const queryHeadersMap = new Map<string, string>();
      const uniqueQueryIds = new Set<string>();
      const splitCache = new Map<string, string[]>();
      queryData.forEach((query) => {
        if (!splitCache.has(query.key)) {
          splitCache.set(query.key, query.key.split(METRICS_JOIN_TEXT));
        }
        const keySplitArray = splitCache.get(query.key);
        const header = keySplitArray ? keySplitArray.join('->') : query.key;
        queryHeadersMap.set(query.id, header);
        uniqueQueryIds.add(query.id);
      });
      type queryDataArrayType = typeof queryData;
      type queryDataType = queryDataArrayType[0];

      // pre-process data according to assignment unit
      const withinSubjectsLookup = new Map<string, Record<string, any>>();
      const logsUser: Record<string, Record<string, any>> = {};

      if (experimentDetails[0].assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS) {
        queryData.forEach((query) => {
          const key = `${query.userId}_${query.uniquifier}`;
          if (!withinSubjectsLookup.has(key)) {
            withinSubjectsLookup.set(key, {});
          }

          const keySplitArray = splitCache.get(query.key);
          let value: any;

          if (query.type === IMetricMetaData.CONTINUOUS) {
            value = +keySplitArray.reduce((accumulator, attribute: string) => accumulator[attribute], query.data);
          } else {
            value = keySplitArray.reduce((accumulator, attribute: string) => accumulator[attribute], query.data);
          }

          withinSubjectsLookup.get(key)[query.id] = value;
        });
      } else {
        // filter and group data according to repeated measure
        const groupedUser: Record<string, Record<string, queryDataType[]>> = {};
        // group data according to user and query id
        queryData.forEach((individualData) => {
          groupedUser[individualData.userId] = groupedUser[individualData.userId] || {};
          groupedUser[individualData.userId][individualData.id] =
            groupedUser[individualData.userId][individualData.id] || [];
          groupedUser[individualData.userId][individualData.id].push(individualData);
        });

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
      }
      // merge with data
      const csvRows = csvExportData.map((row) => {
        let queryObject: Record<string, any> = {};

        if (logsUser?.[row.userId]) {
          queryObject = logsUser[row.userId];
        } else if (experimentDetails[0].assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS) {
          const key = `${row.userId}_${row.uniquifier}`;
          if (withinSubjectsLookup.has(key)) {
            queryObject = withinSubjectsLookup.get(key) ?? {};
          }
        }

        const queryDataToAdd = Object.fromEntries(
          Array.from(uniqueQueryIds).map((queryId) => [queryHeadersMap.get(queryId), queryObject[queryId] || ''])
        );

        const revertToCondition = row.revertTo ? row.revertTo : 'Default';
        const postRule = row.postRule === 'assign' ? `Assign: ${revertToCondition}` : 'Continue';
        const excludeIfReached = row.excludeIfReached ? 'TRUE' : 'FALSE';
        const stratification =
          row.stratification && row.stratificationValue ? `${row.stratification}: ${row.stratificationValue}` : 'NA';

        return {
          ExperimentId: row.experimentId,
          ExperimentName: row.experimentName,
          UserId: row.userId,
          AppContext: row.context[0],
          UnitOfAssignment: row.assignmentUnit,
          GroupType: row.group ? row.group : 'NA',
          GroupId: row.enrollmentGroupId ? row.enrollmentGroupId : 'NA',
          ConsistencyRule: row.consistencyRule ? row.consistencyRule : 'NA',
          ConditionOrder: row.conditionOrder ? row.conditionOrder : 'NA',
          DesignType: row.designType,
          AlgorithmType: row.algorithmType,
          Stratification: stratification,
          Site: row.site,
          Target: row.target,
          ExcludeifReached: excludeIfReached,
          ConditionName: row.conditionName,
          Payload: row.payload ? row.payload : row.conditionName,
          PostRule: postRule,
          EnrollmentStartDate: row.enrollmentStartDate ? new Date(row.enrollmentStartDate).toISOString() : 'NA',
          EnrollmentCompleteDate: row.enrollmentCompleteDate
            ? new Date(row.enrollmentCompleteDate).toISOString()
            : 'NA',
          MarkExperimentPointTime: row.markExperimentPointTime
            ? new Date(row.markExperimentPointTime).toISOString()
            : 'NA',
          EnrollmentCode: row.enrollmentCode,
          ...queryDataToAdd,
        };
      });

      // write in the file
      const csv = new ObjectsToCsv(csvRows);
      try {
        // TODO: check if this is needed
        // if (experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
        //   csv.delimiter = ',';
        // }
        await csv.toDisk(`${folderPath}${simpleExportCSV}`, { append: true });
      } catch (err) {
        console.log(err);
      }

      const email_export = env.email.emailBucket;
      const email_expiry_time = env.email.expireAfterSeconds;
      const email_from = env.email.from;

      const fileName = `${folderPath}${simpleExportCSV}`;
      if (!fs.existsSync(fileName) || csvExportData.length === 0) {
        // if file doesn't exist or no data, create an empty file
        const csvRows = [
          {
            ExperimentId: '',
            ExperimentName: '',
            UserId: '',
            AppContext: '',
            UnitOfAssignment: '',
            GroupType: '',
            GroupId: '',
            ConsistencyRule: '',
            DesignType: '',
            AlgorithmType: '',
            Stratification: '',
            Site: '',
            Target: '',
            ExcludeifReached: '',
            ConditionName: '',
            Payload: '',
            PostRule: '',
            EnrollmentStartDate: '',
            EnrollmentCompleteDate: '',
            MarkExperimentPointTime: '',
            EnrollmentCode: '',
          },
        ];
        const csv = new ObjectsToCsv(csvRows);
        await csv.toDisk(`${folderPath}${simpleExportCSV}`, { append: true });
      }

      const monitorFileBuffer = fs.readFileSync(fileName);
      // delete local file copy:
      fs.unlinkSync(`${folderPath}${simpleExportCSV}`);

      await Promise.all([this.awsService.uploadCSV(monitorFileBuffer, email_export, simpleExportCSV)]);

      const signedURLMonitored = await this.awsService
        .generateSignedURL(email_export, simpleExportCSV, email_expiry_time)
        .catch((err) => {
          // log error here and throw error
          logger.error({ message: `Error in generating signed url for ${simpleExportCSV}`, details: err });
          // throw error because we don't want the code to execute further without the url
          throw err;
        });

      const emailText = `Hey,
        <br>
        Here is the exported experiment data:
        <br>
        <a href="${signedURLMonitored}">Monitored Experiment Data</a>`;

      const emailSubject = `Exported Data for the experiment: ${experimentDetails[0].experimentName}`;
      // send email to the user
      logger.info({ message: `Sending export data email to ${email}` });
      try {
        await this.awsService.sendEmail(email_from, email, emailText, emailSubject);
      } catch (err) {
        const error = {
          type: SERVER_ERROR.EMAIL_SEND_ERROR,
          message: 'Email send error',
          httpCode: 500,
        };
        logger.error({ message: `Export Data email unsuccessful:`, details: error });
        throw error;
      }
      await this.experimentAuditLogRepository.saveRawJson(
        LOG_TYPE.EXPERIMENT_DATA_EXPORTED,
        { experimentName: experimentDetails[0].experimentName },
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
  }
}
