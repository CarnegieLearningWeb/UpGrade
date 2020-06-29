import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentPartitionRepository } from '../repositories/ExperimentPartitionRepository';
import {
  EXPERIMENT_STATE,
  CONSISTENCY_RULE,
  POST_EXPERIMENT_RULE,
  ASSIGNMENT_UNIT,
  SERVER_ERROR,
  IExperimentAssignment,
} from 'upgrade_types';
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
import { ExperimentUserRepository } from '../repositories/ExperimentUserRepository';
import { Experiment } from '../models/Experiment';
import { ExplicitIndividualExclusionRepository } from '../repositories/ExplicitIndividualExclusionRepository';
import { ExplicitGroupExclusionRepository } from '../repositories/ExplicitGroupExclusionRepository';
import { ScheduledJobService } from './ScheduledJobService';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { In } from 'typeorm';
import { PreviewUserService } from './PreviewUserService';
import { ExperimentUser } from '../models/ExperimentUser';
import { PreviewUser } from '../models/PreviewUser';
import { ExperimentUserService } from './ExperimentUserService';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
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
    private monitoredExperimentPointRepository: MonitoredExperimentPointRepository,
    @OrmRepository()
    private userRepository: ExperimentUserRepository,
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

    public previewUserService: PreviewUserService,
    public experimentUserService: ExperimentUserService,
    public scheduledJobService: ScheduledJobService,
    public errorService: ErrorService,
    public settingService: SettingService,
    @Logger(__filename) private log: LoggerInterface
  ) {}
  public async markExperimentPoint(
    userId: string,
    experimentPoint: string,
    experimentName?: string
  ): Promise<MonitoredExperimentPoint> {
    this.log.info(
      `Mark experiment point => Experiment: ${experimentName}, Experiment Point: ${experimentPoint} for User: ${userId}`
    );

    // find working group for user
    const userDoc = await this.experimentUserService.getOriginalUserDoc(userId);

    // adding experiment error when user is not defined
    if (!userDoc) {
      throw new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User not defined: ${userId}`,
        })
      );
    }

    const { workingGroup } = userDoc;

    // query root experiment details
    const experimentPartition = await this.experimentPartitionRepository.findOne({
      where: {
        id: experimentName ? `${experimentName}_${experimentPoint}` : experimentPoint,
      },
      relations: ['experiment'],
    });

    if (experimentPartition) {
      const { experiment } = experimentPartition;
      const promiseArray = [];
      if (
        experiment.enrollmentCompleteCondition &&
        experiment.state === EXPERIMENT_STATE.ENROLLING &&
        experiment.group
      ) {
        promiseArray.push(this.updateExperimentEnrollmentComplete(experiment));
      }
      promiseArray.push(
        this.updateExclusionFromMarkExperimentPoint(userDoc, workingGroup, experimentPartition.experiment)
      );

      await Promise.all(promiseArray);
    }

    const experimentId = experimentName ? `${experimentName}_${experimentPoint}` : experimentPoint;
    // adding in monitored experiment point table
    return this.monitoredExperimentPointRepository.saveRawJson({
      user: userDoc,
      experimentId,
    });
  }

  public async getAllExperimentConditions(
    userId: string,
    context: string,
    toAssign: boolean = true
  ): Promise<IExperimentAssignment[]> {
    this.log.info(`Get all experiment for User Id ${userId}`);
    const usersData: any[] = await Promise.all([
      this.experimentUserService.getOriginalUserDoc(userId),
      this.previewUserService.findOne(userId),
    ]);

    let experimentUser: ExperimentUser = usersData[0];
    const previewUser: PreviewUser = usersData[1];

    // create user if user not defined
    if (!experimentUser) {
      experimentUser = await this.userRepository.save({ id: userId });
    }

    // query all experiment and sub experiment
    let experiments: Experiment[] = [];
    if (previewUser) {
      experiments = await this.experimentRepository.getValidExperimentsWithPreview(context);
    } else {
      experiments = await this.experimentRepository.getValidExperiments(context);
    }

    // Experiment has assignment type as GROUP_ASSIGNMENT
    const hasGroupExperiment = experiments.find((experiment) => experiment.group) ? true : false;

    // check for group and working group
    if (hasGroupExperiment) {
      if (!experimentUser.group || !experimentUser.workingGroup) {
        // filter group experiments
        experiments = experiments.filter((experiment) => experiment.assignmentUnit !== ASSIGNMENT_UNIT.GROUP);

        // add error inside the error database

        // throw error user group not defined
        await this.errorService.create({
          endPoint: '/api/assign',
          errorCode: 417,
          message: `Group not defined for experiment User: ${JSON.stringify(experimentUser, undefined, 2)}`,
          name: 'Experiment user not defined',
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
        } as any);
      } else {
        const keys = Object.keys(experimentUser.workingGroup);
        let addError = false;
        keys.forEach(async (key) => {
          if (!experimentUser.group[key]) {
            // filter experiment whose group membership is not set
            experiments = experiments.filter(
              (experiment) =>
                experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL ||
                (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP && experiment.group !== experimentUser.group[key])
            );
            // add error inside the error database
            addError = true;
          } else {
            if (!experimentUser.group[key].includes(experimentUser.workingGroup[key])) {
              // filter experiment whose group membership is not set
              experiments = experiments.filter(
                (experiment) =>
                  experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL ||
                  (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
                    experiment.group !== experimentUser.group[key])
              );
              // add error inside the error database
              addError = true;
            }
          }
        });
        if (addError) {
          await this.errorService.create({
            endPoint: '/api/assign',
            errorCode: 417,
            message: `Working group not a subset of user group: ${JSON.stringify(experimentUser, undefined, 2)}`,
            name: 'Working group not subset of group',
            type: SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP,
          } as any);
        }
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

      this.log.info('individualAssignments', mergedIndividualAssignment);
      this.log.info('groupAssignment', groupAssignments);
      this.log.info('individualExclusion', individualExclusions);
      this.log.info('groupExclusion', groupExclusions);

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
        const partitions = experiment.partitions.map((partition) => {
          const { expId, expPoint, twoCharacterId } = partition;
          const conditionAssigned = assignment;
          return {
            expId,
            expPoint,
            twoCharacterId,
            assignedCondition: conditionAssigned || {
              conditionCode: 'default',
            },
          };
        });
        return [...accumulator, ...partitions];
      }, []);
    } catch (error) {
      throw new Error(JSON.stringify({ type: SERVER_ERROR.ASSIGNMENT_ERROR, message: `Assignment Error: ${error}` }));
    }
  }

  // TODO add typings here
  public async dataLog(userId: string, jsonLog: any): Promise<Log | any> {
    // this.log.info(`Add data log userId ${userId} and value ${JSON.stringify(jsonLog, null, 2)}`);

    const userDoc = await this.experimentUserService.getOriginalUserDoc(userId);
    const keyUniqueArray = [];

    // extract the array value
    const promise = jsonLog.map(async (individualMetrics) => {
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
        return this.logRepository.update(
          { id: toUpdateLogs.id },
          { data: toUpdateLogs.data, timeStamp: toUpdateLogs.timeStamp }
        );
      });

      await Promise.all(updateLogGroups);

      // metrics to save
      return this.logRepository.save(rawDataLogs);
    });

    return Promise.all(promise);
  }

  public async clientFailedExperimentPoint(
    reason: string,
    experimentPoint: string,
    userId: string,
    experimentId: string
  ): Promise<ExperimentError> {
    const error = new ExperimentError();
    const userDoc = await this.experimentUserService.getOriginalUserDoc(userId);
    error.type = SERVER_ERROR.REPORTED_ERROR;
    error.message = JSON.stringify({
      experimentPoint,
      experimentId,
      userId: userDoc.id,
      reason,
    });
    return this.errorRepository.saveRawJson(error);
  }

  private async updateExperimentEnrollmentComplete(experiment: Experiment): Promise<void> {
    const { enrollmentCompleteCondition, group } = experiment;
    const { groupCount, userCount } = enrollmentCompleteCondition;
    if (groupCount && userCount) {
      // check the group assignments table for user
      const groupAssignments = await this.groupAssignmentRepository.find({ experiment });
      const individualAssignments = await this.individualAssignmentRepository.find({
        where: { experiment },
        relations: ['user'],
      });

      if (groupAssignments.length >= groupCount) {
        // check for student inside each group
        const groupMap = new Map<string, IndividualAssignment[]>();
        groupAssignments.map((groupAssignment) => {
          groupMap.set(groupAssignment.groupId, []);
        });
        individualAssignments.forEach((individualAssignment) => {
          const groupId = individualAssignment.user.workingGroup[group];
          if (groupMap.has(groupId)) {
            groupMap.set(groupId, [...groupMap.get(groupId), individualAssignment]);
          }
        });
        let individualUserSatisfied = true;
        groupMap.forEach((individualAssignment) => {
          if (individualAssignment.length < userCount) {
            individualUserSatisfied = false;
          }
        });

        if (individualUserSatisfied) {
          await this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined);
        }
      }
      // check the individual assignment table for the user
    } else if (userCount) {
      // check the individual assignment table for the user
      const individualAssignmentCount = await this.individualAssignmentRepository.count({ experiment });
      if (individualAssignmentCount >= userCount) {
        // update state of experiment
        await this.experimentRepository.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, undefined);
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
        data[key] = metrics.attributes[key];
        const metricDocOfKey = metricDocs.find((metricDocument) => key === metricDocument.key);
        dataLogMetricsDoc.push(metricDocOfKey);
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
        data[groupClass] = data[groupClass] || {};
        data[groupClass][groupKey] = data[groupClass][groupKey] || {};
        Object.keys(attributes).forEach((metricKey) => {
          data[groupClass][groupKey][metricKey] = attributes[metricKey];
          const key = `${groupClass}${METRICS_JOIN_TEXT}${groupKey}${METRICS_JOIN_TEXT}${metricKey}`;
          const metricDocOfKey = metricDocs.find((metricDocument) => key === metricDocument.key);
          dataLogMetricsDoc.push(metricDocOfKey);
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
    experiment: Experiment
  ): Promise<void> {
    const { state, consistencyRule, id, group } = experiment;

    const assignmentPromise: Array<Promise<any>> = [
      // query individual assignment for user
      this.individualAssignmentRepository.findAssignment(user.id, [id]),
      // query group assignment
      (userEnvironment && this.groupAssignmentRepository.findExperiment([userEnvironment[experiment.group]], [id])) ||
        Promise.resolve([]),
      // query group exclusion
      (userEnvironment && this.groupExclusionRepository.findExcluded([userEnvironment[experiment.group]], [id])) ||
        Promise.resolve([]),
    ];
    const [individualAssignments, groupAssignments, groupExcluded] = await Promise.all(assignmentPromise);

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
      } else if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.REVERT) {
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
