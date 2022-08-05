import { GroupEnrollmentRepository } from './../repositories/GroupEnrollmentRepository';
import { IndividualEnrollmentRepository } from './../repositories/IndividualEnrollmentRepository';
import { IndividualEnrollment } from './../models/IndividualEnrollment';
import { ErrorWithType } from './../errors/ErrorWithType';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { DecisionPoint } from '../models/DecisionPoint';
import { DecisionPointRepository } from '../repositories/DecisionPointRepository';
import {
  EXPERIMENT_STATE,
  CONSISTENCY_RULE,
  POST_EXPERIMENT_RULE,
  ASSIGNMENT_UNIT,
  SERVER_ERROR,
  INewExperimentAssignment,
  FILTER_MODE,
  EXCLUSION_CODE,
} from 'upgrade_types';
import { getExperimentPartitionID } from '../models/DecisionPoint';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { Service } from 'typedi';
import { MonitoredDecisionPointRepository } from '../repositories/MonitoredDecisionPointRepository';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { IndividualExclusion } from '../models/IndividualExclusion';
import { GroupExclusion } from '../models/GroupExclusion';
import { Experiment } from '../models/Experiment';
import { ScheduledJobService } from './ScheduledJobService';
import { ExperimentCondition } from '../models/ExperimentCondition';
import uuid from 'uuid/v4';
import { PreviewUserService } from './PreviewUserService';
import { ExperimentUser } from '../models/ExperimentUser';
import { ExperimentService } from './ExperimentService';
import { PreviewUser } from '../models/PreviewUser';
import { ExperimentUserService } from './ExperimentUserService';
import { MonitoredDecisionPoint, getMonitoredDecisionPointId } from '../models/MonitoredDecisionPoint';
import { ErrorRepository } from '../repositories/ErrorRepository';
import { ExperimentError } from '../models/ExperimentError';
import { ErrorService } from './ErrorService';
import { Log } from '../models/Log';
import { LogRepository } from '../repositories/LogRepository';
import { MetricRepository } from '../repositories/MetricRepository';
import { Metric } from '../models/Metric';
import { METRICS_JOIN_TEXT } from './MetricService';
import { SettingService } from './SettingService';
import isequal from 'lodash.isequal';
import flatten from 'lodash.flatten';
import { ILogInput, ENROLLMENT_CODE } from 'upgrade_types';
import { StateTimeLogsRepository } from '../repositories/StateTimeLogsRepository';
import { StateTimeLog } from '../models/StateTimeLogs';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { SegmentService } from './SegmentService';
import { MonitoredDecisionPointLogRepository } from '../repositories/MonitoredDecisionPointLogRepository';
import seedrandom from 'seedrandom';
import { globalExcludeSegment } from '../../../src/init/seed/globalExcludeSegment';

// TODO delete this after x-prize competition
import {
  assignAlternateCondition,
  replaceAlternateConditionWithValidCondition,
} from '../../../patch/AlternateConditionFunctions';
import { GroupEnrollment } from '../models/GroupEnrollment';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { Segment } from '../models/Segment';
@Service()
export class ExperimentAssignmentService {
  constructor(
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository()
    private decisionPointRepository: DecisionPointRepository,
    @OrmRepository()
    private individualExclusionRepository: IndividualExclusionRepository,
    @OrmRepository() private groupExclusionRepository: GroupExclusionRepository,
    // @OrmRepository()
    // private groupAssignmentRepository: GroupAssignmentRepository,
    @OrmRepository() private groupEnrollmentRepository: GroupEnrollmentRepository,
    @OrmRepository()
    // @OrmRepository()
    // private individualAssignmentRepository: IndividualAssignmentRepository,
    @OrmRepository()
    private individualEnrollmentRepository: IndividualEnrollmentRepository,
    @OrmRepository()
    private monitoredDecisionPointLogRepository: MonitoredDecisionPointLogRepository,
    @OrmRepository()
    private monitoredDecisionPointRepository: MonitoredDecisionPointRepository,
    @OrmRepository()
    private errorRepository: ErrorRepository,
    @OrmRepository()
    private logRepository: LogRepository,
    @OrmRepository()
    private metricRepository: MetricRepository,
    @OrmRepository()
    private stateTimeLogsRepository: StateTimeLogsRepository,
    @OrmRepository()
    private analyticsRepository: AnalyticsRepository,

    public previewUserService: PreviewUserService,
    public experimentUserService: ExperimentUserService,
    public scheduledJobService: ScheduledJobService,
    public errorService: ErrorService,
    public settingService: SettingService,
    public segmentService: SegmentService,
    public experimentService: ExperimentService
  ) {}
  public async markExperimentPoint(
    userId: string,
    experimentPoint: string,
    condition: string | null,
    requestContext: { logger: UpgradeLogger; userDoc: any },
    experimentId?: string
  ): Promise<MonitoredDecisionPoint> {
    // find working group for user
    const { logger, userDoc } = requestContext;

    // adding experiment error when user is not defined
    if (!userDoc) {
      const error = new Error(`User not defined in markExperimentPoint: ${userId}`);
      (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
      (error as any).httpCode = 404;
      logger.error(error);
      throw error;
    }

    const previewUser: PreviewUser = await this.previewUserService.findOne(userId, logger);

    // TODO delete this after x-prize competitionTODO
    condition = replaceAlternateConditionWithValidCondition(experimentPoint, experimentId, condition, userDoc);

    const { workingGroup } = userDoc;

    const decisionPoint = getExperimentPartitionID(experimentPoint, experimentId);
    const experimentPartition = await this.decisionPointRepository.findOne({
      where: {
        id: decisionPoint,
      },
      relations: [
        'experiment',
        'experiment.partitions',
        'experiment.conditions',
        'experiment.experimentSegmentInclusion',
        'experiment.experimentSegmentExclusion',
        'experiment.experimentSegmentInclusion.segment',
        'experiment.experimentSegmentExclusion.segment',
        'experiment.experimentSegmentInclusion.segment.subSegments',
        'experiment.experimentSegmentExclusion.segment.subSegments'
      ],
    });

    logger.info({
      message: `markExperimentPoint: Experiment Name: ${experimentId}, Experiment Point: ${experimentPoint} for User: ${userId}`,
    });

    let monitoredDocument: MonitoredDecisionPoint = await this.monitoredDecisionPointRepository.findOne({
      id: getMonitoredDecisionPointId(decisionPoint, userDoc.id),
    });
    if (experimentPartition) {
      const { experiment } = experimentPartition;
      const { conditions } = experiment;

      const matchedCondition = conditions.filter((dbCondition) => dbCondition.conditionCode === condition);
      if (matchedCondition.length === 0 && condition !== null) {
        const error = new Error(`Condition not found: ${condition}`);
        (error as any).type = SERVER_ERROR.CONDITION_NOT_FOUND;
        logger.error(error);
        throw error;
      }

      let individualEnrollments: IndividualEnrollment;
      let individualExclusions: IndividualExclusion;
      let groupEnrollments: GroupEnrollment | undefined;
      let groupExclusions: GroupExclusion | undefined;
      try {
        [individualEnrollments, individualExclusions, groupEnrollments, groupExclusions] = await Promise.all([
          // query individual assignment for user
          this.individualEnrollmentRepository.findOne({
            where: {
              user: { id: userDoc.id },
              experiment: { id: experiment.id },
              partition: { id: decisionPoint },
            },
          }),
          // query individual exclusion for user
          this.individualExclusionRepository.findOne({
            where: { user: { id: userDoc.id }, experiment: { id: experiment.id } },
          }),
          // query group assignment
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
            workingGroup &&
            workingGroup[experiment.group] &&
            this.groupEnrollmentRepository.findOne({
              where: { groupId: workingGroup[experiment.group], experiment: { id: experiment.id } },
            })) ||
            Promise.resolve(undefined),
          // query group exclusion
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
            workingGroup &&
            workingGroup[experiment.group] &&
            this.groupExclusionRepository.findOne({
              where: { groupId: workingGroup[experiment.group], experiment: { id: experiment.id } },
            })) ||
            Promise.resolve(undefined),
        ]);
      } catch (error) {
        const err: any = error;
        logger.error(err);
        throw err;
      }

      if (
        (experiment.state === EXPERIMENT_STATE.ENROLLING ||
          experiment.state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE) &&
        !previewUser
      ) {
        await this.updateEnrollmentExclusion(
          userDoc,
          experimentPartition.experiment,
          experimentPartition,
          {
            individualEnrollment: individualEnrollments,
            individualExclusion: individualExclusions,
            groupEnrollment: groupEnrollments,
            groupExclusion: groupExclusions,
          },
          logger
        );
        if (experiment.enrollmentCompleteCondition) {
          await this.checkEnrollmentEndingCriteriaForCount(experiment, logger);
        }
      }
    }

    // adding in monitored experiment point table
    if (!monitoredDocument) {
      monitoredDocument = await this.monitoredDecisionPointRepository.saveRawJson({
        user: userDoc,
        condition,
        decisionPoint,
      });
    }

    // save monitored log document
    await this.monitoredDecisionPointLogRepository.save({ monitoredDecisionPoint: monitoredDocument });
    return monitoredDocument;
  }

  public async getAllExperimentConditions(
    userId: string,
    context: string,
    requestContext: { logger: UpgradeLogger; userDoc: any }
  ): Promise<INewExperimentAssignment[]> {
    const { logger, userDoc } = requestContext;
    logger.info({ message: `getAllExperimentConditions: User: ${userId}` });
    const previewUser: PreviewUser = await this.previewUserService.findOne(userId, logger);
    const experimentUser: ExperimentUser = userDoc;

    // throw error if user not defined
    if (!experimentUser) {
      logger.error({ message: `User not defined in getAllExperimentConditions: ${userId}` });
      let error = new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User not defined in getAllExperimentConditions: ${userId}`,
        })
      );
      (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
      (error as any).httpCode = 404;
      throw error;
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

      if (
        !experimentUser.group ||
        !experimentUser.workingGroup ||
        Object.keys(experimentUser.workingGroup).length === 0
      ) {
        const invalidGroupExperiment = await this.groupExperimentWithoutEnrollments(
          groupExperiments,
          experimentUser,
          logger
        );
        const invalidGroupExperimentIds = invalidGroupExperiment.map((experiment) => experiment.id);
        experiments = experiments.filter(({ id }) => !invalidGroupExperimentIds.includes(id));
      } else {
        const experimentWithInvalidGroupOrWorkingGroup = this.experimentsWithInvalidGroupAndWorkingGroup(
          experimentUser,
          groupExperiments
        );
        const invalidGroupExperiment = await this.groupExperimentWithoutEnrollments(
          experimentWithInvalidGroupOrWorkingGroup,
          experimentUser,
          logger
        );
        const invalidGroupExperimentIds = invalidGroupExperiment.map((experiment) => experiment.id);
        experiments = experiments.filter(({ id }) => !invalidGroupExperimentIds.includes(id));
      }
    }

    // try catch block for experiment assignment error
    try {
      // return if no experiment
      if (experiments.length === 0) {
        return [];
      }

      // ============= check if user or group is excluded
      const [userExcluded ,groupExcluded] = await this.checkUserOrGroupIsGloballyExcluded(experimentUser);

      if (userExcluded || groupExcluded.length > 0) {
        // return null if the user or group is excluded from the experiment
        return [];
      }

      let globalFilteredExperiments: Experiment[] = [...experiments];
      const experimentIds = globalFilteredExperiments.map((experiment) => experiment.id);

      // return if no experiment
      if (experimentIds.length === 0) {
        return [];
      }

      // ============ query assignment/exclusion for user
      const allGroupIds: string[] = (experimentUser.workingGroup && Object.values(experimentUser.workingGroup)) || [];
      const [individualEnrollments, groupEnrollments, individualExclusions, groupExclusions] = await Promise.all([
        experimentIds.length > 0
          ? this.individualEnrollmentRepository.findEnrollments(experimentUser.id, experimentIds)
          : Promise.resolve([] as IndividualEnrollment[]),
        allGroupIds.length > 0 && experimentIds.length > 0
          ? this.groupEnrollmentRepository.findEnrollments(allGroupIds, experimentIds)
          : Promise.resolve([] as GroupEnrollment[]),
        experimentIds.length > 0
          ? this.individualExclusionRepository.findExcluded(experimentUser.id, experimentIds)
          : Promise.resolve([] as IndividualExclusion[]),
        allGroupIds.length > 0 && experimentIds.length > 0
          ? this.groupExclusionRepository.findExcluded(allGroupIds, experimentIds)
          : Promise.resolve([] as GroupExclusion[]),
      ]);

      let mergedIndividualAssignment = individualEnrollments;
      // add assignments for individual assignments if preview user
      if (previewUser && previewUser.assignments) {
        const previewAssignment: IndividualEnrollment[] = previewUser.assignments.map((assignment) => {
          return {
            user: experimentUser,
            condition: assignment.experimentCondition,
            ...assignment,
          } as any; // any is used because we don't have partition in the preview assignment
        });
        mergedIndividualAssignment = [...previewAssignment, ...mergedIndividualAssignment];
      }

      // experiment level inclusion and exclusion
      const [filteredExperiments] = await this.experimentLevelExclusionInclusion(
        globalFilteredExperiments,
        experimentUser,
        logger
      );

      // assign remaining experiment
      const experimentAssignment = await Promise.all(
        filteredExperiments.map((experiment) => {
          const individualEnrollment = mergedIndividualAssignment.find((assignment) => {
            return assignment.experiment.id === experiment.id;
          });

          const groupEnrollment = groupEnrollments.find((assignment) => {
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
            individualEnrollment,
            groupEnrollment,
            individualExclusion,
            groupExclusion
          );
        })
      );

      // TODO delete map after x-prize competition
      const mapForAlternateCondition = assignAlternateCondition(userDoc);

      return filteredExperiments
        .reduce((accumulator, experiment, index) => {
          const assignment = experimentAssignment[index];
          const { state, logging, name } = experiment;
          const partitions = experiment.partitions.map((partition) => {
            const { target, site, twoCharacterId } = partition;
            const conditionAssigned = assignment;
            // adding info based on experiment state or logging flag
            if (logging || state === EXPERIMENT_STATE.PREVIEW) {
              // TODO add enrollment code here
              logger.info({
                message: `getAllExperimentConditions: experiment: ${name}, user: ${userId}, condition: ${
                  conditionAssigned ? conditionAssigned.conditionCode : null
                }`,
              });
            }
            return {
              target,
              site,
              twoCharacterId,
              assignedCondition: conditionAssigned || {
                conditionCode: null,
              },
            };
          });
          return assignment ? [...accumulator, ...partitions] : accumulator;
        }, [])
        .map(mapForAlternateCondition); // TODO delete map after x-prize competition
    } catch (err) {
      const error = err as ErrorWithType;
      error.details = 'Error in assignment';
      error.type = SERVER_ERROR.ASSIGNMENT_ERROR;
      logger.error(error);
      throw error;
    }
  }


  private async checkUserOrGroupIsGloballyExcluded(experimentUser: ExperimentUser): Promise<[string, string[]]> {
    let userGroup = [];
    userGroup = Object.keys(experimentUser.workingGroup || {}).map((type: string) => {
      return `${type}_${experimentUser.workingGroup[type]}`;
    });

    const globalExcludeSegmentObj = {};
    const segmentDetails: Segment[] = [], excludedUsers:string[] = [], excludedGroups = [];

    globalExcludeSegmentObj[globalExcludeSegment.id] = {
      segmentIdsQueue: [globalExcludeSegment.id],
      currentIncludedSegmentIds: [],
      currentExcludedSegmentIds: [globalExcludeSegment.id],
      allIncludedSegmentIds: [],
      allExcludedSegmentIds: [globalExcludeSegment.id],
    }

    const [updatedGlobalExcludeSegmentObj, updatedSegmentDetails] = await this.resolveSegment(globalExcludeSegmentObj, segmentDetails, 0);

    updatedGlobalExcludeSegmentObj[globalExcludeSegment.id].allExcludedSegmentIds.forEach((segmentId) => {
      const foundSegment: Segment = updatedSegmentDetails.find((segment) => segment.id === segmentId);
      excludedUsers.push(...foundSegment.individualForSegment.map((individual) => individual.userId));
      excludedGroups.push(...foundSegment.groupForSegment.map((group) => `${group.type}_${group.groupId}`));
    });

    //users and groups excluded from GlobalExclude segment
    const userExcluded = excludedUsers.find((userId) => userId === experimentUser.id);
    const groupExcluded = userGroup.length > 0 ? excludedGroups.filter((group) => userGroup.includes(group)) : [];

    return [userExcluded, groupExcluded];
  }

  // When browser will be sending the blob data
  public async blobDataLog(userId: string, blobLog: ILogInput[], logger: UpgradeLogger): Promise<Log[]> {
    logger.info({ message: `Add blob data userId ${userId}`, details: blobLog });
    const userDoc = await this.experimentUserService.getOriginalUserDoc(userId, logger);
    const keyUniqueArray = [];

    // throw error if user not defined
    if (!userDoc) {
      logger.error({ message: `User not found in blobDataLog, userId => ${userId}`, details: blobLog });
      throw new Error(`User not defined in blobDataLog: ${userId}`);
    }

    // extract the array value
    const promise = blobLog.map(async (individualMetrics) => {
      return this.createLog(individualMetrics, keyUniqueArray, userDoc, logger);
    });

    const logsToReturn = await Promise.all(promise);
    return flatten(logsToReturn);
  }

  public async dataLog(
    userId: string,
    jsonLog: ILogInput[],
    requestContext: { logger: UpgradeLogger; userDoc: any }
  ): Promise<Log[]> {
    const { logger, userDoc } = requestContext;
    logger.info({ message: `Add data log userId ${userId}`, details: jsonLog });
    const keyUniqueArray = [];

    // throw error if user not defined
    if (!userDoc) {
      logger.error({ message: `User not found in dataLog, userId => ${userId}`, details: jsonLog });
      let error = new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User not defined dataLog: ${userId}`,
        })
      );
      (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
      (error as any).httpCode = 404;
      throw error;
    }

    // extract the array value
    const promise = jsonLog.map(async (individualMetrics) => {
      return this.createLog(individualMetrics, keyUniqueArray, userDoc, logger);
    });

    const logsToReturn = await Promise.all(promise);
    return flatten(logsToReturn);
  }

  public async clientFailedExperimentPoint(
    reason: string,
    experimentPoint: string,
    userId: string,
    experimentId: string,
    requestContext: { logger: UpgradeLogger; userDoc: any }
  ): Promise<ExperimentError> {
    const error = new ExperimentError();
    const { logger, userDoc } = requestContext;
    logger.info({ message: `Failed experiment point for userId ${userId}` });

    // throw error if user not defined
    if (!userDoc) {
      logger.error({ message: `User not found in clientFailedExperimentPoint, userId => ${userId}` });
      let error = new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User not defined clientFailedExperimentPoint: ${userId}`,
        })
      );
      (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
      (error as any).httpCode = 404;
      throw error;
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

  private async groupExperimentWithoutEnrollments(
    experiments: Experiment[],
    experimentUser: ExperimentUser,
    logger: UpgradeLogger
  ): Promise<Experiment[]> {
    // fetch individual assignment for group experiments
    const individualEnrollments = await (experiments.length > 0
      ? this.individualEnrollmentRepository.findEnrollments(
          experimentUser.id,
          experiments.map(({ id }) => id)
        )
      : Promise.resolve([]));

    // check assignments for group experiment
    const experimentAssignedIds = individualEnrollments.map((assignment) => {
      return assignment.experiment.id;
    });

    // create set of experiment ids
    const groupExperimentAssignedIds = Array.from(new Set(experimentAssignedIds));

    if (groupExperimentAssignedIds.length > 0) {
      logger.warn({
        message: `Experiments Id: ${groupExperimentAssignedIds.join(' ')}
      Experiment already assigned but working group and group data is not properly set`,
      });
    }

    // exclude experiments which are not previously assigned and throw error
    const experimentToExclude = experiments.filter((experiment) => {
      return groupExperimentAssignedIds.indexOf(experiment.id) === -1;
    });

    const experimentToExcludeIds = experimentToExclude.map((experiment) => experiment.id);

    // throw error user group not defined and add experiments which are excluded
    experimentToExclude.forEach(({ id, name }) => {
      logger.error({
        message: `Experiment Id: ${id},
      Experiment Name: ${name},
      Group not valid for experiment user
      `,
      });
    });
    await this.errorService.create(
      {
        endPoint: '/api/assign',
        errorCode: 417,
        message: `Group not defined for experiment User: ${JSON.stringify(
          { ...experimentUser, experiment: experimentToExcludeIds },
          undefined,
          2
        )}`,
        name: 'Experiment user not defined',
        type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
      } as any,
      logger
    );
    return experimentToExclude;
  }

  private experimentsWithInvalidGroupAndWorkingGroup(user: ExperimentUser, experiments: Experiment[]): Experiment[] {
    return experiments.filter((experiment) => {
      const { group } = experiment;
      if (group in user.group && group in user.workingGroup) {
        return !user.group[group].includes(user.workingGroup[group]);
      } else {
        return true;
      }
    });
  }

  private async createLog(
    individualMetrics: ILogInput,
    keyUniqueArray: any[],
    userDoc: ExperimentUser,
    logger: UpgradeLogger
  ): Promise<Log[]> {
    const userId = userDoc.id;
    const {
      timestamp,
      metrics,
      metrics: { groupedMetrics },
    } = individualMetrics;
    logger.info({ message: `Add data log in createLog: userId => ${userId}`, details: individualMetrics });
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
      logger.info({ message: `Add group metrics userId ${userId}`, details: groupedMetrics });
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
    let rawDataLogs = this.createDataLogsFromCLFormat(timestamp, metrics, groupedMetrics, metricDocs, userDoc, logger);

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

  private async getMonitoredDocumentOfExperiment(experimentDoc: Experiment): Promise<MonitoredDecisionPoint[]> {
    // get groupAssignment and individual assignment details
    const partitions = experimentDoc.partitions;
    const individualAssignments = await this.individualEnrollmentRepository.find({
      where: { experiment: experimentDoc },
      relations: ['user'],
    });

    // get the monitored document for all the partitions in the experiment
    const experimentPartitionIds = partitions.map((partition) => {
      const experimentId = partition.target;
      const experimentPoint = partition.site;
      return getExperimentPartitionID(experimentPoint, experimentId);
    });

    const monitoredDocumentIds = [];
    individualAssignments.forEach((individualAssignment) => {
      experimentPartitionIds.forEach((experimentPartitionId) => {
        monitoredDocumentIds.push(getMonitoredDecisionPointId(experimentPartitionId, individualAssignment.user.id));
      });
    });

    // fetch all the monitored document if exist
    const monitoredDocuments = await this.monitoredDecisionPointRepository.findByIds(monitoredDocumentIds, {
      relations: ['user'],
    });

    return monitoredDocuments;
  }

  /**
   * Check the enrollment complete condition for experiments with ending criteria
   * of group count and participants count defined in experiment
   * experiment - Experiment definition
   */
  private async checkEnrollmentEndingCriteriaForCount(experiment: Experiment, logger: UpgradeLogger): Promise<void> {
    const { enrollmentCompleteCondition } = experiment;
    const { groupCount, userCount } = enrollmentCompleteCondition;

    const timeLogDate = new Date();
    /**
     * Create stateTimeLog document which will be inserted if ending criteria is met
     */
    const stateTimeLogDoc = new StateTimeLog();
    stateTimeLogDoc.id = uuid();
    stateTimeLogDoc.fromState = experiment.state;
    stateTimeLogDoc.toState = EXPERIMENT_STATE.ENROLLMENT_COMPLETE;
    stateTimeLogDoc.timeLog = timeLogDate;
    stateTimeLogDoc.experiment = experiment;

    if (groupCount && userCount && experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
      const groupSatisfied: number = await this.getGroupAssignmentStatus(experiment.id, logger);

      if (groupSatisfied >= groupCount) {
        await this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined);
        await this.stateTimeLogsRepository.save(stateTimeLogDoc);
      }

      const usersPerGroup = await this.analyticsRepository.getEnrollmentCountPerGroup(experiment.id);
      const validGroups = usersPerGroup.filter(({ count }) => count >= userCount);
      if (validGroups.length >= groupCount) {
        await Promise.all([
          this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined),
          this.stateTimeLogsRepository.save(stateTimeLogDoc),
        ]);
      }
    } else if (userCount) {
      const individualEnrollmentNumber = await this.individualEnrollmentRepository.getEnrollmentCountForExperiment(
        experiment.id
      );
      // fetch all the monitored document if exist
      const monitoredDocuments = await this.getMonitoredDocumentOfExperiment(experiment);
      const userIds = monitoredDocuments.map((doc) => {
        return doc.user.id;
      });
      const uniqueUser = new Set(userIds);
      if (uniqueUser.size >= userCount) {
        await this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined);
        await this.stateTimeLogsRepository.save(stateTimeLogDoc);
      }
      if (individualEnrollmentNumber >= userCount) {
        await Promise.all([
          this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined),
          this.stateTimeLogsRepository.save(stateTimeLogDoc),
        ]);
      }
    }
  }

  public async getGroupAssignmentStatus(experimentId: string, logger: UpgradeLogger) {
    const experiment = await this.experimentService.findOne(experimentId, logger);
    if (experiment) {
      if (
        experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
        experiment.enrollmentCompleteCondition &&
        experiment.enrollmentCompleteCondition.groupCount &&
        experiment.enrollmentCompleteCondition.userCount
      ) {
        const { enrollmentCompleteCondition } = experiment;
        const { userCount } = enrollmentCompleteCondition;
        const usersPerGroup = await this.analyticsRepository.getEnrollmentCountPerGroup(experiment.id);

        let groupSatisfied = usersPerGroup.filter(({ count }) => {
          if (count >= userCount) {
            return true;
          }
          return false;
        });

        return groupSatisfied.length;
      }
      return null;
    }
    return undefined;
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
    userDoc: ExperimentUser,
    logger: UpgradeLogger
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
    logger.info({ message: 'data logs created in createDataLogsFromCLFormat', details: dataLogs });
    return dataLogs;
  }

  private async updateEnrollmentExclusion(
    user: ExperimentUser,
    experiment: Experiment,
    partition: DecisionPoint,
    {
      individualEnrollment,
      individualExclusion,
      groupEnrollment,
      groupExclusion,
    }: {
      individualEnrollment: IndividualEnrollment;
      individualExclusion: IndividualExclusion;
      groupEnrollment: GroupEnrollment;
      groupExclusion: GroupExclusion;
    },
    logger: UpgradeLogger
  ): Promise<void> {
    const { assignmentUnit, state, consistencyRule } = experiment;

    // Check if user or group is in global exclusion list
    const [userExcluded, groupExcluded] = await this.checkUserOrGroupIsGloballyExcluded(user);

    const [includedExperiments, excludedExperiment] = await this.experimentLevelExclusionInclusion([experiment], user, logger);
    // experiment level exclusion
    let experimentExcluded = false;
    if (includedExperiments.length === 0) {
      experimentExcluded = true;
    }

    // Don't mark the experiment if user or group are in exclusion list
    // TODO update this with segment implementation
    if (userExcluded) {
      const excludeUserDoc: Pick<IndividualExclusion, 'user' | 'experiment' | 'exclusionCode'> = {
        user,
        experiment,
        exclusionCode: EXCLUSION_CODE.PARTICIPANT_ON_EXCLUSION_LIST,
      };
      await this.individualExclusionRepository.saveRawJson([excludeUserDoc]);
      return;
    } else if (groupExcluded.length > 0) {
      const excludeGroupDoc: Pick<GroupExclusion, 'groupId' | 'experiment' | 'exclusionCode'> = {
        groupId: user?.workingGroup[experiment.group],
        experiment,
        exclusionCode: EXCLUSION_CODE.GROUP_ON_EXCLUSION_LIST,
      };
      await this.groupExclusionRepository.saveRawJson([excludeGroupDoc]);
      return;
    } else if (experimentExcluded) {
      // TODO: testing this
      if(excludedExperiment[0].reason === 'user') {
        const excludeUserDoc: Pick<IndividualExclusion, 'user' | 'experiment' | 'exclusionCode'> = {
          user,
          experiment,
          exclusionCode: EXCLUSION_CODE.PARTICIPANT_ON_EXCLUSION_LIST,
        };
        await this.individualExclusionRepository.saveRawJson([excludeUserDoc]);
      } else if (excludedExperiment[0].reason === 'group') {
        const excludeGroupDoc: Pick<GroupExclusion, 'groupId' | 'experiment' | 'exclusionCode'> = {
          groupId: user?.workingGroup[experiment.group],
          experiment,
          exclusionCode: EXCLUSION_CODE.GROUP_ON_EXCLUSION_LIST,
        };
        await this.groupExclusionRepository.saveRawJson([excludeGroupDoc]);
      } else {
        const excludeUserDoc: Pick<IndividualExclusion, 'user' | 'experiment' | 'exclusionCode'> = {
          user,
          experiment,
          exclusionCode: EXCLUSION_CODE.PARTICIPANT_ON_EXCLUSION_LIST,
        };
        await this.individualExclusionRepository.saveRawJson([excludeUserDoc]);
      }
      return ;
    }

    // if group experiment check if group is valid
    let noGroupSpecified = false;
    let invalidGroup = false;
    if (assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
      if (!user.group || !user.workingGroup || Object.keys(user.workingGroup).length === 0) {
        noGroupSpecified = true;
      } else {
        const experimentWithInvalidGroupOrWorkingGroup = this.experimentsWithInvalidGroupAndWorkingGroup(user, [
          experiment,
        ]);
        if (experimentWithInvalidGroupOrWorkingGroup.length > 0) {
          invalidGroup = true;
        }
      }
    }

    // Populating enrollment and exclusion document
    if (state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE && consistencyRule !== CONSISTENCY_RULE.EXPERIMENT) {
      const promiseArray = [];
      if (assignmentUnit === ASSIGNMENT_UNIT.GROUP && user?.workingGroup?.[experiment.group] && !invalidGroup) {
        if (!groupEnrollment && !groupExclusion) {
          // exclude group here
          const excludeGroupDoc: Pick<GroupExclusion, 'groupId' | 'experiment' | 'exclusionCode'> = {
            groupId: user?.workingGroup[experiment.group],
            experiment,
            exclusionCode: EXCLUSION_CODE.REACHED_AFTER,
          };
          promiseArray.push(this.groupExclusionRepository.saveRawJson([excludeGroupDoc]));
        }
      }

      if (!individualEnrollment && !individualExclusion) {
        if (assignmentUnit === ASSIGNMENT_UNIT.GROUP && !groupEnrollment) {
          const excludeUserDoc: Pick<IndividualExclusion, 'user' | 'experiment' | 'exclusionCode'> = {
            user,
            experiment,
            exclusionCode: EXCLUSION_CODE.REACHED_AFTER,
          };
          promiseArray.push(this.individualExclusionRepository.saveRawJson([excludeUserDoc]));
        } else if (assignmentUnit !== ASSIGNMENT_UNIT.GROUP) {
          const excludeUserDoc: Pick<IndividualExclusion, 'user' | 'experiment' | 'exclusionCode'> = {
            user,
            experiment,
            exclusionCode: EXCLUSION_CODE.REACHED_AFTER,
          };
          promiseArray.push(this.individualExclusionRepository.saveRawJson([excludeUserDoc]));
        }
      }
      await Promise.all(promiseArray);
    } else {
      if (assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
        const promiseArray = [];
        let conditionAssigned;
        if (!noGroupSpecified && !invalidGroup) {
          conditionAssigned = this.assignExperiment(
            user,
            experiment,
            individualEnrollment,
            groupEnrollment,
            individualExclusion,
            groupExclusion
          );
        }

        // get condition which should be assigned
        if (!groupEnrollment && !groupExclusion && conditionAssigned && !invalidGroup && !noGroupSpecified) {
          const groupEnrollmentDocument: Omit<GroupEnrollment, 'createdAt' | 'updatedAt' | 'versionNumber'> = {
            id: uuid(),
            experiment,
            partition: partition as DecisionPoint,
            groupId: user.workingGroup[experiment.group],
            condition: conditionAssigned,
          };
          promiseArray.push(this.groupEnrollmentRepository.save(groupEnrollmentDocument));
        }

        // TODO check this where is this required
        if (groupExclusion && !individualExclusion && consistencyRule !== CONSISTENCY_RULE.EXPERIMENT) {
          const individualExclusionDocument: Omit<
            IndividualExclusion,
            'id' | 'createdAt' | 'updatedAt' | 'versionNumber'
          > = {
            experiment,
            user,
            exclusionCode: EXCLUSION_CODE.EXCLUDED_DUE_TO_GROUP_LOGIC,
          };
          individualExclusion = individualExclusionDocument as IndividualExclusion;
          promiseArray.push(this.individualExclusionRepository.saveRawJson([individualExclusionDocument]));
        }

        if (!individualEnrollment && !individualExclusion && conditionAssigned && !invalidGroup && !noGroupSpecified) {
          const individualEnrollmentDocument: Omit<IndividualEnrollment, 'createdAt' | 'updatedAt' | 'versionNumber'> =
            {
              id: uuid(),
              experiment,
              partition: partition as DecisionPoint,
              user,
              condition: conditionAssigned,
              groupId: user?.workingGroup[experiment.group],
              enrollmentCode: groupEnrollment ? ENROLLMENT_CODE.GROUP_LOGIC : ENROLLMENT_CODE.ALGORITHMIC,
            };
          promiseArray.push(this.individualEnrollmentRepository.save(individualEnrollmentDocument));
        }

        if (
          !individualEnrollment &&
          !individualExclusion &&
          (invalidGroup || noGroupSpecified) &&
          consistencyRule !== CONSISTENCY_RULE.EXPERIMENT
        ) {
          const individualExclusionDocument: Omit<
            IndividualExclusion,
            'id' | 'createdAt' | 'updatedAt' | 'versionNumber'
          > = {
            experiment,
            user,
            exclusionCode: invalidGroup
              ? EXCLUSION_CODE.INVALID_GROUP_OR_WORKING_GROUP
              : EXCLUSION_CODE.NO_GROUP_SPECIFIED,
          };
          promiseArray.push(this.individualExclusionRepository.saveRawJson([individualExclusionDocument]));
        }
        await Promise.all(promiseArray);
      } else {
        const conditionAssigned = this.assignExperiment(
          user,
          experiment,
          individualEnrollment,
          groupEnrollment,
          individualExclusion,
          groupExclusion
        );
        if (!individualEnrollment && !individualExclusion && conditionAssigned) {
          const individualEnrollmentDocument: Omit<IndividualEnrollment, 'createdAt' | 'updatedAt' | 'versionNumber'> =
            {
              id: uuid(),
              experiment,
              partition: partition as DecisionPoint,
              user,
              condition: conditionAssigned,
              enrollmentCode: ENROLLMENT_CODE.ALGORITHMIC,
            };
          await this.individualEnrollmentRepository.save(individualEnrollmentDocument);
        }
      }
    }
  }

  private assignExperiment(
    user: ExperimentUser,
    experiment: Experiment,
    individualEnrollment: IndividualEnrollment | undefined,
    groupEnrollment: GroupEnrollment | undefined,
    individualExclusion: IndividualExclusion | undefined,
    groupExclusion: GroupExclusion | undefined
  ): ExperimentCondition | void {
    const userId = user.id;
    if (experiment.state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE && userId) {
      if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
        if (experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL) {
          return individualExclusion
            ? undefined
            : individualEnrollment?.condition
            ? individualEnrollment?.condition
            : groupExclusion
            ? undefined
            : groupEnrollment?.condition;
        } else if (experiment.consistencyRule === CONSISTENCY_RULE.GROUP) {
          return groupExclusion
            ? undefined
            : groupEnrollment?.condition
            ? groupEnrollment?.condition
            : individualExclusion
            ? undefined
            : individualEnrollment?.condition;
        } else {
          return experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL
            ? individualEnrollment?.condition
            : groupEnrollment?.condition;
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
      if (experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL) {
        return individualExclusion
          ? undefined
          : individualEnrollment?.condition
          ? individualEnrollment?.condition
          : groupExclusion
          ? undefined
          : groupEnrollment?.condition
          ? groupEnrollment?.condition
          : this.assignRandom(experiment, user);
      } else if (experiment.consistencyRule === CONSISTENCY_RULE.GROUP) {
        return groupExclusion
          ? undefined
          : groupEnrollment?.condition
          ? groupEnrollment?.condition
          : individualExclusion
          ? undefined
          : individualEnrollment?.condition
          ? individualEnrollment?.condition
          : this.assignRandom(experiment, user);
      } else {
        return (
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL
            ? individualEnrollment?.condition
            : groupEnrollment?.condition) || this.assignRandom(experiment, user)
        );
      }
    }
    return;
  }

  private assignRandom(experiment: Experiment, user: ExperimentUser): ExperimentCondition {
    const randomSeed =
      experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL
        ? `${experiment.id}_${user.id}`
        : `${experiment.id}_${user.workingGroup[experiment.group]}`;

    const sortedExperimentCondition = experiment.conditions.sort(
      (condition1, condition2) => condition1.order - condition2.order
    );
    const spec = sortedExperimentCondition.map((condition) => condition.assignmentWeight);
    const r = seedrandom(randomSeed)() * 100;
    let sum = 0;
    let randomConditions = 0;
    for (let i = 0; i < spec.length; i++) {
      sum += spec[i];
      if (r <= sum) {
        randomConditions = i;
        break;
      }
    }
    const experimentalCondition = experiment.conditions[randomConditions];
    return experimentalCondition;
  }

  private async resolveSegment(segmentObj: object, segmentDetails: Segment[] ,depth: number): Promise<any> {
    const segmentsToFetchArray = Object.keys(segmentObj).map((expId) => segmentObj[expId].segmentIdsQueue);
    const segmentsToFetch = segmentsToFetchArray.flat();

    if (depth === 5 || segmentsToFetch.length === 0) {
      return [segmentObj, segmentDetails];
    }

    const segmentDetailsFetched = await this.segmentService.getSegmentByIds(segmentsToFetch);
    segmentDetails.push(...segmentDetailsFetched);

    Object.keys(segmentObj).forEach((expId) => {
      const exp = segmentObj[expId];

      let newIncludedSegments: string[] = [], newExcludedSegments: string[] = [];

      exp.currentIncludedSegmentIds.forEach((includedSegmentId) => {
        const foundSegment = segmentDetails.find(({id}) => id === includedSegmentId);
        newIncludedSegments.push(...foundSegment.subSegments.map((subSegment) => subSegment.id));
      });

      exp.currentExcludedSegmentIds.forEach((excludedSegmentId) => {
        const foundSegment = segmentDetails.find(({id}) => id === excludedSegmentId);
        newExcludedSegments.push(...foundSegment.subSegments.map((subSegment) => subSegment.id));
      });
      
      if(depth < 4) { 
        exp.segmentIdsQueue = [...newIncludedSegments, ...newExcludedSegments];
        exp.currentIncludedSegmentIds = [...newIncludedSegments];
        exp.currentExcludedSegmentIds = [...newExcludedSegments];
        exp.allIncludedSegmentIds.push(...newIncludedSegments);
        exp.allExcludedSegmentIds.push(...newExcludedSegments);
      }
    });

    return this.resolveSegment(segmentObj, segmentDetails, ++depth);
  }

  private async experimentLevelExclusionInclusion(
    experiments: Experiment[],
    experimentUser: ExperimentUser,
    logger: UpgradeLogger
  ): Promise<[Experiment[], {experiment: Experiment, reason: string}[]]> {
    let segmentDetails: Segment[] = [];
    let segmentObj = {};

    experiments.forEach((exp) => {
      const includeId = exp.experimentSegmentInclusion.segment.id;
      const excludeId = exp.experimentSegmentExclusion.segment.id;

      segmentObj[exp.id] = {
        segmentIdsQueue: [includeId, excludeId],
        currentIncludedSegmentIds: [includeId],
        currentExcludedSegmentIds: [excludeId],
        allIncludedSegmentIds: [includeId],
        allExcludedSegmentIds: [excludeId],
      };
    });

    let depth = 0;
    [segmentObj, segmentDetails] = await this.resolveSegment(segmentObj, segmentDetails, depth);

    let explicitExperimentIndividualInclusionFilteredData: { userId: string, experimentId: string; }[] = [];
    let explicitExperimentIndividualExclusionFilteredData: { userId: string, experimentId: string; }[] = [];
    let explicitExperimentGroupInclusionFilteredData: { groupId: string, type: string, experimentId: string; }[] = [];
    let explicitExperimentGroupExclusionFilteredData: { groupId: string, type: string, experimentId: string; }[] = [];

    Object.keys(segmentObj).forEach((expId) => {
      const exp = segmentObj[expId];

      exp.allIncludedSegmentIds.forEach((includedSegmentId) => {
        const foundSegment = segmentDetails.find(({id}) => id === includedSegmentId);

        foundSegment.individualForSegment.forEach((individual) => {
          if (individual.userId === experimentUser.id) {
            explicitExperimentIndividualInclusionFilteredData.push({
              userId: individual.userId, experimentId: expId
            });
          }
        });

        foundSegment.groupForSegment.forEach((group) => {
          explicitExperimentGroupInclusionFilteredData.push({
            groupId: group.groupId, type: group.type, experimentId: expId
          });
        });
      });

      exp.allExcludedSegmentIds.forEach((excludedSegmentId) => {
        const foundSegment = segmentDetails.find(({id}) => id === excludedSegmentId);

        foundSegment.individualForSegment.forEach((individual) => {
          if (individual.userId === experimentUser.id) {
            explicitExperimentIndividualExclusionFilteredData.push({
              userId: individual.userId, experimentId: expId
            });
          }
        });

        foundSegment.groupForSegment.forEach((group) => {
          explicitExperimentGroupExclusionFilteredData.push({
            groupId: group.groupId, type: group.type, experimentId: expId
          });
        });
      });
    });

    let userGroups = [];
    if (experimentUser.group) {
      Object.keys(experimentUser.group).forEach((type) => {
        experimentUser.group[type].forEach((groupId) => {
          userGroups.push({ type, groupId });
        });
      });
    }

    // psuedocode for experiment level inclusion and exclusion
    //
    // If the user or the user's group is on the global exclude list, exclude the user.
    //
    // ELSE If the experiment default is "include all" then
    //     If the user is on the exclude list, then exclude the user.
    //     Else if any of the user's groups is on the exclude list then
    //           If the user is on the include list, include the user
    //           Else exclude the user
    //     Else include the user.
    // ELSE If the experiment default is "exclude all" then
    //     If the user is on the include list, then include the user.
    //     Else if any of the user's groups are on the include list then
    //           If the user is on the exclude list, exclude the user
    //           Else include the user
    //     Else exclude the user

    let includedExperiments: Experiment[] = [];
    let excludedExperiments = [];


    experiments.forEach((experiment) => {
      let inclusionFlag = false;
      let exclusionFlag = false;
      
      if (experiment.filterMode === FILTER_MODE.INCLUDE_ALL) {
        if (explicitExperimentIndividualExclusionFilteredData.some((e) => e.experimentId === experiment.id)) {
          excludedExperiments.push({ experiment: experiment, reason: 'user'});
        } else if (explicitExperimentIndividualInclusionFilteredData.some((e) => e.experimentId === experiment.id)) {
          includedExperiments.push(experiment);
        } else {
          for (let userGroup of userGroups) {
            if (explicitExperimentGroupExclusionFilteredData.some((e) =>
                  e.groupId === userGroup.groupId && e.type === userGroup.type && e.experimentId === experiment.id)
            ) {
              inclusionFlag=true;
            }
          }
          if(!inclusionFlag) {
            includedExperiments.push(experiment);
          } else {
            excludedExperiments.push({experiment: experiment, reason: 'group'});
          }
        }
      } else {
        if (explicitExperimentIndividualInclusionFilteredData.some((e) => e.experimentId === experiment.id)) {
          includedExperiments.push(experiment);
        } else if (explicitExperimentIndividualExclusionFilteredData.some((e) => e.experimentId === experiment.id)) {
          excludedExperiments.push({experiment: experiment, reason: 'filterMode'});
        } else {
          for (let userGroup of userGroups) {
            if (explicitExperimentGroupInclusionFilteredData.some((e) =>
                  e.groupId === userGroup.groupId && e.type === userGroup.type && e.experimentId === experiment.id)
            ) {
              exclusionFlag=true;
            }
          }
          if(!exclusionFlag) {
            excludedExperiments.push({experiment: experiment, reason: 'filterMode'});
          } else {
            includedExperiments.push(experiment);
          }
        }
      }
    });

    return [includedExperiments, excludedExperiments];
  }
}
