import { ErrorWithType } from './../errors/ErrorWithType';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentPartitionRepository } from '../repositories/ExperimentPartitionRepository';
import {
  EXPERIMENT_STATE,
  CONSISTENCY_RULE,
  POST_EXPERIMENT_RULE,
  ASSIGNMENT_UNIT,
  SERVER_ERROR,
  IExperimentAssignment,
  ENROLLMENT_CODE,
} from 'upgrade_types';
import { getExperimentPartitionID } from '../models/ExperimentPartition';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { Service } from 'typedi';
import { MonitoredExperimentPointRepository } from '../repositories/MonitoredExperimentPointRepository';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { GroupAssignmentRepository } from '../repositories/GroupAssignmentRepository';
import { IndividualAssignmentRepository } from '../repositories/IndividualAssignmentRepository';
import { IndividualAssignment } from '../models/IndividualAssignment';
import { GroupAssignment } from '../models/GroupAssignment';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { GroupExclusion } from '../models/GroupExclusion';
import { Experiment } from '../models/Experiment';
import { ExplicitIndividualExclusionRepository } from '../repositories/ExplicitIndividualExclusionRepository';
import { ExplicitGroupExclusionRepository } from '../repositories/ExplicitGroupExclusionRepository';
import { ScheduledJobService } from './ScheduledJobService';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { In } from 'typeorm';
import uuid from 'uuid/v4';
import { PreviewUserService } from './PreviewUserService';
import { ExperimentUser } from '../models/ExperimentUser';
import { PreviewUser } from '../models/PreviewUser';
import { ExperimentUserService } from './ExperimentUserService';
import { MonitoredExperimentPoint, getMonitoredExperimentPointID } from '../models/MonitoredExperimentPoint';
import { ErrorRepository } from '../repositories/ErrorRepository';
import { ExperimentError } from '../models/ExperimentError';
import { ErrorService } from './ErrorService';
import { ASSIGNMENT_TYPE } from '../../types';
import { Log } from '../models/Log';
import { LogRepository } from '../repositories/LogRepository';
import { MetricRepository } from '../repositories/MetricRepository';
import { Metric } from '../models/Metric';
import { METRICS_JOIN_TEXT } from './MetricService';
import { SettingService } from './SettingService';
import isequal from 'lodash.isequal';
import flatten from 'lodash.flatten';
import { ILogInput } from 'upgrade_types';
import { MonitoredExperimentPointLogRepository } from '../repositories/MonitorExperimentPointLogRepository';
import { StateTimeLogsRepository } from '../repositories/StateTimeLogsRepository';
import { StateTimeLog } from '../models/StateTimeLogs';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

@Service()
export class ExperimentAssignmentService {
  constructor(
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository()
    private experimentPartitionRepository: ExperimentPartitionRepository,
    @OrmRepository()
    private individualExclusionRepository: IndividualExclusionRepository,
    @OrmRepository() private groupExclusionRepository: GroupExclusionRepository,
    @OrmRepository()
    private groupAssignmentRepository: GroupAssignmentRepository,
    @OrmRepository()
    private individualAssignmentRepository: IndividualAssignmentRepository,
    @OrmRepository()
    private monitoredExperimentPointLogRepository: MonitoredExperimentPointLogRepository,
    @OrmRepository()
    private monitoredExperimentPointRepository: MonitoredExperimentPointRepository,
    @OrmRepository()
    private explicitIndividualExclusionRepository: ExplicitIndividualExclusionRepository,
    @OrmRepository()
    private explicitGroupExclusionRepository: ExplicitGroupExclusionRepository,
    @OrmRepository()
    private errorRepository: ErrorRepository,
    @OrmRepository()
    private logRepository: LogRepository,
    @OrmRepository()
    private metricRepository: MetricRepository,
    @OrmRepository()
    private stateTimeLogsRepository: StateTimeLogsRepository,

    public previewUserService: PreviewUserService,
    public experimentUserService: ExperimentUserService,
    public scheduledJobService: ScheduledJobService,
    public errorService: ErrorService,
    public settingService: SettingService,
  ) {}
  public async markExperimentPoint(
    userId: string,
    experimentPoint: string,
    condition: string | null,
    requestContext: {logger: UpgradeLogger, userDoc: any},
    experimentName?: string,
  ): Promise<MonitoredExperimentPoint> {
    // find working group for user
    const { logger, userDoc } = requestContext;

    // adding experiment error when user is not defined
    if (!userDoc) {
      const error = new Error(`User not defined: ${userId}`);
      (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
      throw error;
    }
    const { workingGroup } = userDoc;

    // query root experiment details
    const experimentPartition = await this.experimentPartitionRepository.findOne({
      where: {
        id: getExperimentPartitionID(experimentPoint, experimentName),
      },
      relations: ['experiment', 'experiment.partitions'],
    });

    let enrollmentCode: ENROLLMENT_CODE | null = null;
    const experimentId = getExperimentPartitionID(experimentPoint, experimentName);

    logger.info({ message: `markExperimentPoint: Experiment Name: ${experimentName}, Experiment Point: ${experimentPoint} for User: ${userId}` });

    if (experimentPartition) {
      const { experiment } = experimentPartition;
      const { conditions } = await this.experimentRepository.findOne({
        where: {
          id: experiment.id,
        },
        relations: ['conditions'],
      });
      const matchedCondition = conditions.filter((dbCondition) => dbCondition.conditionCode === condition);
      if (matchedCondition.length === 0 && condition !== null) {
        const error = new Error(`Condition not found: ${condition}`);
        (error as any).type = SERVER_ERROR.CONDTION_NOT_FOUND;
        throw error;
      }

      const assignmentPromise: Array<Promise<any>> = [
        // query individual assignment for user
        this.individualAssignmentRepository.findAssignment(userDoc.id, [experiment.id]),
        // query group assignment
        (workingGroup &&
          this.groupAssignmentRepository.findExperiment([workingGroup[experiment.group]], [experiment.id])) ||
          Promise.resolve([]),
        // query group exclusion
        (workingGroup &&
          this.groupExclusionRepository.findExcluded([workingGroup[experiment.group]], [experiment.id])) ||
          Promise.resolve([]),
      ];
      const result = await Promise.all(assignmentPromise);
      const individualAssignments: IndividualAssignment[] = result[0];
      const groupExcluded: GroupAssignment[] = result[2];

      await this.updateExclusionFromMarkExperimentPoint(userDoc, workingGroup, experimentPartition.experiment, result);

      // find monitored document
      const monitoredDocumentExist = await this.monitoredExperimentPointRepository.findOne({
        id: getMonitoredExperimentPointID(experimentId, userDoc.id),
      });

      // new document of user will be saved
      if (!monitoredDocumentExist) {
        if (experiment.state === EXPERIMENT_STATE.ENROLLING) {
          enrollmentCode = ENROLLMENT_CODE.INCLUDED;
          if (experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL) {
            if (individualAssignments.length === 0) {
              enrollmentCode = ENROLLMENT_CODE.STUDENT_EXCLUDED;
            }
          } else if (experiment.consistencyRule === CONSISTENCY_RULE.GROUP) {
            if (groupExcluded.length > 0) {
              enrollmentCode = ENROLLMENT_CODE.GROUP_EXCLUDED;
            }
          } else if (experiment.consistencyRule === CONSISTENCY_RULE.EXPERIMENT) {
            enrollmentCode = ENROLLMENT_CODE.INCLUDED;
          }
        } else if (experiment.state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE) {
          if (experiment.consistencyRule !== CONSISTENCY_RULE.EXPERIMENT) {
            enrollmentCode = ENROLLMENT_CODE.PRIOR_EXPERIMENT_ENROLLING;
          }
        }
      } else if (
        monitoredDocumentExist &&
        monitoredDocumentExist.enrollmentCode === null &&
        experiment.state === EXPERIMENT_STATE.ENROLLING &&
        experiment.consistencyRule === CONSISTENCY_RULE.EXPERIMENT
      ) {
        enrollmentCode = ENROLLMENT_CODE.INCLUDED;

        // update enrollment code
        await this.monitoredExperimentPointRepository.update({ id: monitoredDocumentExist.id }, { enrollmentCode });
      }
    }

    // adding in monitored experiment point table
    const monitoredDocument = await this.monitoredExperimentPointRepository.saveRawJson({
      user: userDoc,
      condition,
      experimentId,
      enrollmentCode,
    });

    /**
     * Check the enrollment complete condition for experiments with ending criteria
     * group count and participants count
     */
    const experimentDoc = experimentPartition?.experiment;
    if (
      experimentDoc &&
      experimentDoc.enrollmentCompleteCondition &&
      experimentDoc.state === EXPERIMENT_STATE.ENROLLING
    ) {
      await this.checkEnrollmentEndingCriteriaForCount(experimentDoc);
    }

    // save monitored log document
    await this.monitoredExperimentPointLogRepository.save({ monitoredExperimentPoint: monitoredDocument });

    return monitoredDocument;
  }

  public async getAllExperimentConditions(
    userId: string,
    context: string,
    requestContext: {logger: UpgradeLogger, userDoc: any},
    toAssign: boolean = true
  ): Promise<IExperimentAssignment[]> {
    const { logger, userDoc } = requestContext;
    logger.info({ message: `getAllExperimentConditions: User: ${userId}` });
    const previewUser: PreviewUser = await this.previewUserService.findOne(userId, logger);
    const experimentUser: ExperimentUser = userDoc;

    // throw error if user not defined
    if (!experimentUser) {
      throw new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User not defined : ${userId}`,
        })
      );
    }

    // query all experiment and sub experiment
    let experiments: Experiment[] = [];
    if (previewUser) {
      experiments = await this.experimentRepository.getValidExperimentsWithPreview(context);
    } else {
      experiments = await this.experimentRepository.getValidExperiments(context);
    }

    // Experiment has assignment type as GROUP_ASSIGNMENT
    const groupExperiments = experiments.filter(({ assignmentUnit }) => assignmentUnit === ASSIGNMENT_UNIT.GROUP);
    // check for group and working group
    if (groupExperiments.length > 0) {
      /**
       * Check already assigned group experiment or exclude group experiment
       * @param filteredGroupExperiments
       * @param addError
       */
      const checkValidGroupExperiment = async (filteredGroupExperiments: Experiment[], addError: boolean = true) => {
        // fetch individual assignment for group experiments
        const individualAssignments = await (filteredGroupExperiments.length > 0
          ? this.individualAssignmentRepository.findAssignment(
              experimentUser.id,
              filteredGroupExperiments.map(({ id }) => id)
            )
          : Promise.resolve([]));

        // check assignments for group experiment
        const groupExperimentAssignedIds = individualAssignments.map((assignment) => {
          return assignment.experiment.id;
        });

        if (groupExperimentAssignedIds.length > 0) {
          logger.warn({ message: `Experiments Id: ${groupExperimentAssignedIds.join(' ')}
          Experiment already assigned but working group and group data is not properly set`});
        }

        // exclude experiments which are not previously assigned and throw error
        const experimentToExclude = filteredGroupExperiments.filter((experiment) => {
          return groupExperimentAssignedIds.indexOf(experiment.id) === -1;
        });

        const experimentToExcludeIds = experimentToExclude.map((experiment) => experiment.id);

        // throw error user group not defined and add experiments which are excluded
        if (addError) {
          experimentToExclude.forEach(({ id, name }) => {
            logger.error({ message: `Experiment Id: ${id},
            Experiment Name: ${name},
            Group not valid for experiment user
            ` });
          });

          await this.errorService.create({
            endPoint: '/api/assign',
            errorCode: 417,
            message: `Group not defined for experiment User: ${JSON.stringify(
              { ...experimentUser, experiment: experimentToExcludeIds },
              undefined,
              2
            )}`,
            name: 'Experiment user not defined',
            type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          } as any, logger);
        }

        // exclude user whose group information is not provided
        if (experimentToExclude.length > 0) {
          await this.individualExclusionRepository.saveRawJson(
            experimentToExclude.map((experiment) => {
              return {
                experiment,
                user: experimentUser,
              };
            })
          );
        }
      };

      if (
        !experimentUser.group ||
        !experimentUser.workingGroup ||
        Object.keys(experimentUser.workingGroup).length === 0
      ) {
        await checkValidGroupExperiment(groupExperiments);
      } else {
        const workingGroupKeys = Object.keys(experimentUser.workingGroup);
        // get valid working group keys
        const validWorkingGroupKeys = workingGroupKeys.filter((key) => {
          const groupHasKey = experimentUser.group[key];
          // if group doesn't has working group key
          if (!groupHasKey) {
            return false;
          }

          const groupHasWorkingGroupKey = !!experimentUser.group[key].includes(experimentUser.workingGroup[key]);
          if (!groupHasWorkingGroupKey) {
            return false;
          }

          return true;
        });

        let addError = false;
        if (validWorkingGroupKeys.length < workingGroupKeys.length) {
          addError = true;
        }

        const experimentWithInvalidGroupOrWorkingGroup = experiments.filter((experiment) => {
          return (
            experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP && !validWorkingGroupKeys.includes(experiment.group)
          );
        });

        await checkValidGroupExperiment(experimentWithInvalidGroupOrWorkingGroup, addError);
      }
    }

    // try catch block for experiment assignment error
    try {
      // return if no experiment
      if (experiments.length === 0) {
        return [];
      }

      // ============= check if user or group is excluded
      let userGroup = [];
      userGroup = Object.keys(experimentUser.workingGroup || {}).map((type: string) => {
        return `${type}_${experimentUser.workingGroup[type]}`;
      });

      const [userExcluded, groupExcluded] = await Promise.all([
        this.explicitIndividualExclusionRepository.find({ userId: experimentUser.id }),
        userGroup.length > 0 ? this.explicitGroupExclusionRepository.find({ where: { id: In(userGroup) } }) : [],
      ]);

      if (userExcluded.length > 0) {
        // return null if the user is excluded from the experiment
        return [];
      }

      // filter group experiment according to group excluded
      let filteredExperiments: Experiment[] = [...experiments];
      if (groupExcluded.length > 0) {
        const groupNameArray = groupExcluded.map((group) => group.type);
        filteredExperiments = experiments.filter((experiment) => {
          if (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
            return !groupNameArray.includes(experiment.group);
          }
          return true;
        });
      }

      const experimentIds = filteredExperiments.map((experiment) => experiment.id);

      // return if no experiment
      if (experimentIds.length === 0) {
        return [];
      }

      // ============ query assignment/exclusion for user
      const allGroupIds: string[] = (experimentUser.workingGroup && Object.values(experimentUser.workingGroup)) || [];
      const promiseAssignmentExclusion: any[] = [
        experimentIds.length > 0
          ? this.individualAssignmentRepository.findAssignment(experimentUser.id, experimentIds)
          : [],
        allGroupIds.length > 0 && experimentIds.length > 0
          ? this.groupAssignmentRepository.findExperiment(allGroupIds, experimentIds)
          : [],
        experimentIds.length > 0
          ? this.individualExclusionRepository.findExcluded(experimentUser.id, experimentIds)
          : [],
        allGroupIds.length > 0 && experimentIds.length > 0
          ? this.groupExclusionRepository.findExcluded(allGroupIds, experimentIds)
          : [],
      ];

      const promiseData = await Promise.all(promiseAssignmentExclusion);

      const individualAssignments: IndividualAssignment[] = promiseData[0];
      const groupAssignments: GroupAssignment[] = promiseData[1];
      const individualExclusions: IndividualExclusion[] = promiseData[2];
      const groupExclusions: GroupExclusion[] = promiseData[3];

      let mergedIndividualAssignment = individualAssignments;
      // add assignments for individual assignments if preview user
      if (previewUser && previewUser.assignments) {
        const previewAssignment = previewUser.assignments.map((assignment) => {
          return {
            experiment: assignment.experiment,
            user: experimentUser,
            condition: assignment.experimentCondition,
          };
        });
        mergedIndividualAssignment = [...(previewAssignment as any), ...mergedIndividualAssignment];
      }

      // assign remaining experiment
      const experimentAssignment = await Promise.all(
        filteredExperiments.map((experiment) => {
          const individualAssignment = mergedIndividualAssignment.find((assignment) => {
            return assignment.experiment.id === experiment.id;
          });

          const groupAssignment = groupAssignments.find((assignment) => {
            return (
              assignment.experiment.id === experiment.id &&
              assignment.groupId === experimentUser.workingGroup[experiment.group]
            );
          });

          const individualExclusion = individualExclusions.find((exclusion) => {
            return exclusion.experiment.id === experiment.id;
          });

          const groupExclusion = groupExclusions.find((exclusion) => {
            return (
              exclusion.experiment.id === experiment.id &&
              exclusion.groupId === experimentUser.workingGroup[experiment.group]
            );
          });

          return this.assignExperiment(
            experimentUser,
            experiment,
            individualAssignment,
            groupAssignment,
            individualExclusion,
            groupExclusion,
            previewUser,
            toAssign
          );
        })
      );

      return filteredExperiments.reduce((accumulator, experiment, index) => {
        const assignment = experimentAssignment[index];
        const { state, logging, name } = experiment;
        const partitions = experiment.partitions.map((partition) => {
          const { expId, expPoint, twoCharacterId } = partition;
          const conditionAssigned = assignment;
          // adding info based on experiment state or logging flag
          if (logging || state === EXPERIMENT_STATE.PREVIEW) {
            // TODO add enrollment code here
            logger.info({ message: `getAllExperimentConditions: experiment: ${name}, user: ${userId}, condition: ${
              conditionAssigned ? conditionAssigned.conditionCode : null
            }` });
          }
          return {
            expId,
            expPoint,
            twoCharacterId,
            assignedCondition: conditionAssigned || {
              conditionCode: null,
            },
          };
        });
        return assignment ? [...accumulator, ...partitions] : accumulator;
      }, []);
    } catch (err) {
      const error = err as ErrorWithType;
      error.details = 'Error in assignment'
      error.type = SERVER_ERROR.ASSIGNMENT_ERROR;
      logger.error(error);
      throw error;
    }
  }

  // When browser will be sending the blob data
  public async blobDataLog(userId: string, blobLog: ILogInput[], logger: UpgradeLogger): Promise<Log[]> {
    logger.info({ message: `Add blob data userId ${userId}`, details: blobLog });
    const userDoc = await this.experimentUserService.getOriginalUserDoc(userId, logger);
    const keyUniqueArray = [];

    // throw error if user not defined
    if (!userDoc) {
      throw new Error(`User not defined: ${userId}`);
    }

    // extract the array value
    const promise = blobLog.map(async (individualMetrics) => {
      return this.createLog(individualMetrics, keyUniqueArray, userDoc);
    });

    const logsToReturn = await Promise.all(promise);
    return flatten(logsToReturn);
  }

  public async dataLog(userId: string, jsonLog: ILogInput[], requestContext: {logger: UpgradeLogger, userDoc: any}): Promise<Log[]> {
    const { logger, userDoc } = requestContext;
    logger.info({ message: `Add data log userId ${userId}`, details: jsonLog });
    const keyUniqueArray = [];

    // throw error if user not defined
    if (!userDoc) {
      throw new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User not defined: ${userId}`,
        })
      );
    }

    // extract the array value
    const promise = jsonLog.map(async (individualMetrics) => {
      return this.createLog(individualMetrics, keyUniqueArray, userDoc);
    });

    const logsToReturn = await Promise.all(promise);
    return flatten(logsToReturn);
  }

  public async clientFailedExperimentPoint(
    reason: string,
    experimentPoint: string,
    userId: string,
    experimentId: string,
    requestContext: {logger: UpgradeLogger, userDoc: any}
  ): Promise<ExperimentError> {
    const error = new ExperimentError();
    const { logger, userDoc } = requestContext;
    logger.info({ message: `Failed experiment point for userId ${userId}`});

    // throw error if user not defined
    if (!userDoc) {
      throw new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User not defined: ${userId}`,
        })
      );
    }

    error.type = SERVER_ERROR.REPORTED_ERROR;
    error.message = JSON.stringify({
      experimentPoint,
      experimentId,
      userId: userDoc.id,
      reason,
    });
    return this.errorRepository.saveRawJson(error);
  }

  private async createLog(
    individualMetrics: ILogInput,
    keyUniqueArray: any[],
    userDoc: ExperimentUser
  ): Promise<Log[]> {
    const userId = userDoc.id;
    const {
      timestamp,
      metrics,
      metrics: { groupedMetrics },
    } = individualMetrics;

    // add individual metrics in the database
    if (metrics && metrics.attributes) {
      // search metrics log with default uniquifier
      keyUniqueArray.push(
        ...Object.keys(metrics.attributes).map((metricKey) => {
          return { key: metricKey, uniquifier: 1 };
        })
      );
    }

    // add group metrics in the database
    if (groupedMetrics) {
      // search metrics log with specific uniquifier
      groupedMetrics.forEach(({ groupClass, groupKey, groupUniquifier, attributes }) => {
        const key = `${groupClass}${METRICS_JOIN_TEXT}${groupKey}${METRICS_JOIN_TEXT}`;
        Object.keys(attributes).forEach((metricKey) => {
          keyUniqueArray.push({ key: `${key}${metricKey}`, uniquifier: groupUniquifier });
        });
      });
    }
    // all metrics keys
    let metricKeys = keyUniqueArray.map(({ key }) => key);
    // const uniquifierKeys = keyUniqueArray.map(({ uniquifier }) => uniquifier);

    // get metrics document
    const metricDocs = await this.metricRepository.findMetricsWithQueries(metricKeys);

    if (metricDocs.length === 0) {
      return [];
    }

    const filteredKeyUniqueArray = keyUniqueArray.filter(({ key }) => {
      return metricDocs.find((doc) => doc.key === key);
    });

    metricKeys = filteredKeyUniqueArray.map(({ key }) => key);
    const uniquifierKeys = filteredKeyUniqueArray.map(({ uniquifier }) => uniquifier);

    // get all metric detail
    const logGroup = await this.logRepository.getMetricUniquifierData(metricKeys, uniquifierKeys, userId);

    const mergedLogGroup = [];

    // merge the metrics field
    logGroup.forEach((logData, index) => {
      if (logData !== null) {
        // tslint:disable-next-line:no-shadowed-variable
        const { id, uniquifier, data, timestamp, key } = logData;
        const metric_keys = [key];
        for (let i = index + 1; i < logGroup.length; i++) {
          const toCheckMetrics = logGroup[i];
          // merge the data log here
          if (
            toCheckMetrics.id === id &&
            toCheckMetrics.uniquifier === uniquifier &&
            isequal(toCheckMetrics.data, data) &&
            new Date(toCheckMetrics.timestamp).getTime() === new Date(timestamp).getTime()
          ) {
            metric_keys.push(toCheckMetrics.key);
            logGroup[i] = null;
          }
        }
        mergedLogGroup.push({ ...logData, key: metric_keys });
      }
    });

    // if logGroup is empty insert the log data
    // transform log data to database format
    // array for dataLogs

    const toUpdateLogGroup = [];
    let rawDataLogs = this.createDataLogsFromCLFormat(timestamp, metrics, groupedMetrics, metricDocs, userDoc);

    rawDataLogs.forEach((rawLogs) => {
      // tslint:disable-next-line:no-shadowed-variable
      const { metrics, data, uniquifier, timeStamp } = rawLogs;

      metrics.forEach((metric, index) => {
        const metricArray = metric.key.split(METRICS_JOIN_TEXT);
        const lastKey = metricArray.pop();
        const logGroupSelected = toUpdateLogGroup.find((logGroupIndividual) => {
          return logGroupIndividual.key.includes(metric.key);
        });

        if (logGroupSelected && uniquifier === logGroupSelected.uniquifier) {
          if (new Date(timeStamp).getTime() >= new Date(logGroupSelected.timeStamp).getTime()) {
            const logGroupSelectedRoot = this.getRootMetric(logGroupSelected.data, metricArray);
            const dataRoot = this.getRootMetric(data, metricArray);
            logGroupSelectedRoot[lastKey] = dataRoot[lastKey];
          }

          // delete metric and data from the logGroup
          const dataRootToDelete = this.getRootMetric(data, metricArray);
          delete dataRootToDelete[lastKey];
          delete metrics[index];
        } else {
          // add log group to toUpdateLogGroup Array
          const toMergeElement = mergedLogGroup.find((mergedLogGroupElement) => {
            return mergedLogGroupElement.key.includes(metric.key);
          });

          if (toMergeElement && uniquifier === toMergeElement.uniquifier) {
            if (new Date(timeStamp).getTime() >= new Date(toMergeElement.timestamp).getTime()) {
              const toMergeElementRoot = this.getRootMetric(toMergeElement.data, metricArray);
              const dataRoot = this.getRootMetric(data, metricArray);
              toMergeElementRoot[lastKey] = dataRoot[lastKey];
              // toMergeElement.data[metric.key] = data[metric.key];
              toMergeElement.timeStamp = timeStamp;

              toUpdateLogGroup.push(toMergeElement);
            }

            // delete metric and data from the logGroup
            const dataRootToDelete = this.getRootMetric(data, metricArray);
            delete dataRootToDelete[lastKey];
            delete metrics[index];
          }
        }
      });
    });

    // filter rawDataLogs
    // tslint:disable-next-line:no-shadowed-variable
    rawDataLogs = rawDataLogs.filter(({ metrics }) => {
      const metricArray = metrics.filter((metric) => metric !== null);
      return metricArray.length > 0;
    });

    // metrics to update
    const updateLogGroups = toUpdateLogGroup.map((toUpdateLogs) => {
      return this.logRepository.updateLog(toUpdateLogs.id, toUpdateLogs.data, toUpdateLogs.timeStamp);
    });

    const updatedLog: Log[] = await Promise.all(updateLogGroups);

    let newLogData: Log[] = [];
    // metrics to save
    if (rawDataLogs.length > 0) {
      newLogData = await this.logRepository.save(rawDataLogs);
    }

    return [...updatedLog, ...newLogData];
  }

  /**
   * Check the enrollment complete condition for experiments with ending criteria
   * of group count and participants count defined in experiment
   * experiment - Experiment definition
   */
  private async checkEnrollmentEndingCriteriaForCount(experiment: Experiment): Promise<void> {
    const { enrollmentCompleteCondition, group, partitions } = experiment;
    const { groupCount, userCount } = enrollmentCompleteCondition;

    // get assignments and fetch monitored document for those assignments
    const getMonitoredDocumentOfExperiment = async (experimentDoc: Experiment) => {
      // get groupAssignment and individual assignment details
      const individualAssignments = await this.individualAssignmentRepository.find({
        where: { experiment: experimentDoc },
        relations: ['user'],
      });

      // get the monitored document for all the partitions in the experiment
      const experimentPartitionIds = partitions.map((partition) => {
        const experimentId = partition.expId;
        const experimentPoint = partition.expPoint;
        return getExperimentPartitionID(experimentPoint, experimentId);
      });

      const monitoredDocumentIds = [];
      individualAssignments.forEach((individualAssignment) => {
        experimentPartitionIds.forEach((experimentPartitionId) => {
          monitoredDocumentIds.push(getMonitoredExperimentPointID(experimentPartitionId, individualAssignment.user.id));
        });
      });

      // fetch all the monitored document if exist
      const monitoredDocuments = await this.monitoredExperimentPointRepository.findByIds(monitoredDocumentIds, {
        relations: ['user'],
      });

      return monitoredDocuments;
    };

    /**
     * This should only be possible when
     * experiment assignment unit is GROUP
     * ending condition has both groupCount and userCount
     */
    const timeLogDate = new Date();

    const stateTimeLogDoc = new StateTimeLog();
    stateTimeLogDoc.id = uuid();
    stateTimeLogDoc.fromState = experiment.state;
    stateTimeLogDoc.toState = EXPERIMENT_STATE.ENROLLMENT_COMPLETE;
    stateTimeLogDoc.timeLog = timeLogDate;
    stateTimeLogDoc.experiment = experiment;

    if (groupCount && userCount && experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
      // fetch all the monitored document if exist
      const monitoredDocuments = await getMonitoredDocumentOfExperiment(experiment);

      // check for student inside each group
      const groupMap = new Map<string, Set<string>>();
      // groupAssignments.forEach((groupAssignment) => {
      //   groupMap.set(groupAssignment.groupId, []);
      // });
      monitoredDocuments.forEach((monitoredDocument) => {
        const groupId = monitoredDocument.user.workingGroup[group];
        // create new Set for new group
        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, new Set());
        }
        groupMap.set(groupId, groupMap.get(groupId).add(monitoredDocument.user.id));
      });
      let groupSatisfied = 0;

      groupMap.forEach((groupElement) => {
        if (groupElement.size >= userCount) {
          groupSatisfied++;
        }
      });

      if (groupSatisfied >= groupCount) {
        await this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined);
        await this.stateTimeLogsRepository.save(stateTimeLogDoc);
      }
      // check the individual assignment table for the user
    } else if (userCount) {
      // fetch all the monitored document if exist
      const monitoredDocuments = await getMonitoredDocumentOfExperiment(experiment);
      const userIds = monitoredDocuments.map((doc) => {
        return doc.user.id;
      });
      const uniqueUser = new Set(userIds);
      if (uniqueUser.size >= userCount) {
        await this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined);
        await this.stateTimeLogsRepository.save(stateTimeLogDoc);
      }
    }
  }

  private getRootMetric(object: any, keys: string[]): any {
    let rootElement = object;
    keys.forEach((key) => {
      rootElement = rootElement[key];
    });
    return rootElement;
  }

  private createDataLogsFromCLFormat(
    timestamp: string,
    metrics: any,
    groupedMetrics: any,
    metricDocs: Metric[],
    userDoc: ExperimentUser
  ): Log[] {
    const dataLogs = [];
    if (metrics && metrics.attributes) {
      const data = {};
      const dataLogMetricsDoc = [];
      Object.keys(metrics.attributes).forEach((key) => {
        const metricDocOfKey = metricDocs.find((metricDocument) => key === metricDocument.key);
        if (metricDocOfKey) {
          dataLogMetricsDoc.push(metricDocOfKey);
          data[key] = metrics.attributes[key];
        }
      });
      if (dataLogMetricsDoc.length > 0) {
        dataLogs.push({
          timeStamp: timestamp,
          uniquifier: '1',
          data,
          metrics: dataLogMetricsDoc,
          user: userDoc,
        });
      }
    }

    // adding group metrics
    if (groupedMetrics) {
      // search metrics log with specific uniquifier
      groupedMetrics.forEach(({ groupClass, groupKey, groupUniquifier, attributes }) => {
        const data = {};
        const dataLogMetricsDoc = [];

        Object.keys(attributes).forEach((metricKey) => {
          const key = `${groupClass}${METRICS_JOIN_TEXT}${groupKey}${METRICS_JOIN_TEXT}${metricKey}`;
          const metricDocOfKey = metricDocs.find((metricDocument) => key === metricDocument.key);
          if (metricDocOfKey) {
            dataLogMetricsDoc.push(metricDocOfKey);
            data[groupClass] = data[groupClass] || {};
            data[groupClass][groupKey] = data[groupClass][groupKey] || {};
            data[groupClass][groupKey][metricKey] = attributes[metricKey];
          }
        });
        if (dataLogMetricsDoc.length > 0) {
          dataLogs.push({
            timeStamp: timestamp,
            uniquifier: groupUniquifier,
            data,
            metrics: dataLogMetricsDoc,
            user: userDoc,
          });
        }
      });
    }

    return dataLogs;
  }

  private async updateExclusionFromMarkExperimentPoint(
    user: ExperimentUser,
    userEnvironment: any,
    experiment: Experiment,
    assignmentPromise: any
  ): Promise<void> {
    const { state, consistencyRule, group } = experiment;

    const [individualAssignments, groupAssignments, groupExcluded] = assignmentPromise;

    if (consistencyRule !== CONSISTENCY_RULE.EXPERIMENT) {
      if (state === EXPERIMENT_STATE.ENROLLING) {
        if (groupExcluded.length > 0) {
          this.individualExclusionRepository.saveRawJson([
            {
              experiment,
              user,
            },
          ]);
        }
      } else if (state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE) {
        if (consistencyRule === CONSISTENCY_RULE.INDIVIDUAL || consistencyRule === CONSISTENCY_RULE.GROUP) {
          if (individualAssignments.length === 0) {
            this.individualExclusionRepository.saveRawJson([
              {
                experiment,
                user,
              },
            ]);
          }
        }
        if (consistencyRule === CONSISTENCY_RULE.GROUP) {
          if (groupAssignments.length === 0) {
            this.groupExclusionRepository.saveRawJson([
              {
                experiment,
                groupId: userEnvironment[group],
              },
            ]);
          }
        }
      }
    }
  }

  private async assignExperiment(
    user: ExperimentUser,
    experiment: Experiment,
    individualAssignment: IndividualAssignment | undefined,
    groupAssignment: GroupAssignment | undefined,
    individualExclusion: IndividualExclusion | undefined,
    groupExclusion: GroupExclusion | undefined,
    previewUser: PreviewUser,
    toAssign: boolean
  ): Promise<ExperimentCondition | void> {
    const userId = user.id;
    const userEnvironment = user.workingGroup;
    if (experiment.state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE && userId) {
      if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
        if (individualAssignment) {
          // override the individual assignment
          // save the preview user here
          if (previewUser && previewUser.assignments) {
            const previewAssigned = previewUser.assignments.find((assignment) => {
              return assignment.experiment.id === experiment.id;
            });
            if (previewAssigned) {
              if (toAssign) {
                // rewrite the individual assignment if preview assignment
                this.individualAssignmentRepository.saveRawJson({
                  experiment,
                  user,
                  condition: previewAssigned.experimentCondition,
                  assignmentType: ASSIGNMENT_TYPE.MANUAL,
                });
                return previewAssigned.experimentCondition;
              } else {
                return;
              }
            }
          }
          return individualAssignment.condition;
        } else if (individualExclusion) {
          return;
        } else if (groupAssignment) {
          return groupAssignment.condition;
        } else if (groupExclusion) {
          return;
        } else {
          return;
        }
      } else if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.ASSIGN) {
        if (!experiment.revertTo) {
          return;
        } else {
          const condition = experiment.conditions.find((key) => key.id === experiment.revertTo);
          return condition;
        }
      }
    } else if (
      (experiment.state === EXPERIMENT_STATE.ENROLLING || experiment.state === EXPERIMENT_STATE.PREVIEW) &&
      userId
    ) {
      if (individualAssignment) {
        // override the individual assignment
        if (previewUser && previewUser.assignments) {
          const previewAssigned = previewUser.assignments.find((assignment) => {
            return assignment.experiment.id === experiment.id;
          });
          if (previewAssigned) {
            if (toAssign) {
              // rewrite the individual assignment if preview assignment
              this.individualAssignmentRepository.saveRawJson({
                experiment,
                user,
                condition: previewAssigned.experimentCondition,
                assignmentType: ASSIGNMENT_TYPE.MANUAL,
              });
              return previewAssigned.experimentCondition;
            } else {
              return;
            }
          }
        }
        return individualAssignment.condition;
      } else if (individualExclusion) {
        return;
      } else if (groupAssignment) {
        if (toAssign) {
          // add entry in individual assignment
          this.individualAssignmentRepository.saveRawJson({
            experiment,
            user,
            condition: groupAssignment.condition,
            assignmentType: ASSIGNMENT_TYPE.ALGORITHMIC,
          });
          return groupAssignment.condition;
        } else {
          return;
        }
      } else if (groupExclusion) {
        return;
      } else {
        const randomConditions = this.weightedRandom(
          experiment.conditions.map((condition) => condition.assignmentWeight)
        );
        const experimentalCondition = experiment.conditions[randomConditions];
        // assignment operations will happen here
        if (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
          if (toAssign) {
            await Promise.all([
              this.groupAssignmentRepository.saveRawJson({
                experiment,
                groupId: userEnvironment[experiment.group],
                condition: experimentalCondition,
              }),
              this.individualAssignmentRepository.saveRawJson({
                experiment,
                user,
                condition: experimentalCondition,
                assignmentType: ASSIGNMENT_TYPE.ALGORITHMIC,
              }),
            ]);
            return experimentalCondition;
          } else {
            return;
          }
        } else if (experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL) {
          if (toAssign) {
            await this.individualAssignmentRepository.saveRawJson({
              experiment,
              user,
              condition: experimentalCondition,
              assignmentType: ASSIGNMENT_TYPE.ALGORITHMIC,
            });
            return experimentalCondition;
          } else {
            return;
          }
        }
      }
    }
    return;
  }

  private weightedRandom(spec: number[]): number {
    let sum = 0;
    const r = Math.random() * 100;
    for (let i = 0; i < spec.length; i++) {
      sum += spec[i];
      if (r <= sum) {
        return i;
      }
    }
    return 0;
  }
}
