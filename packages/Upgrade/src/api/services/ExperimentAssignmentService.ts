import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentPartitionRepository } from '../repositories/ExperimentPartitionRepository';
import {
  EXPERIMENT_STATE,
  CONSISTENCY_RULE,
  POST_EXPERIMENT_RULE,
  ASSIGNMENT_UNIT,
  EXPERIMENT_LOG_TYPE,
  SERVER_ERROR,
} from 'ees_types';
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
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import { Experiment } from '../models/Experiment';
import { ExplicitIndividualExclusionRepository } from '../repositories/ExplicitIndividualExclusionRepository';
import { ExplicitGroupExclusionRepository } from '../repositories/ExplicitGroupExclusionRepository';
import { ScheduledJobService } from './ScheduledJobService';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { User } from '../models/User';
import { AuditLogData } from 'ees_types/dist/Experiment/interfaces';
import { In } from 'typeorm';
import { PreviewUserService } from './PreviewUserService';
import { ExperimentUser } from '../models/ExperimentUser';
import { PreviewUser } from '../models/PreviewUser';
import { ExperimentUserService } from './ExperimentUserService';

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
    private experimentAuditLogRepository: ExperimentAuditLogRepository,
    public previewUserService: PreviewUserService,
    public experimentUserService: ExperimentUserService,
    public scheduledJobService: ScheduledJobService,
    @Logger(__filename) private log: LoggerInterface
  ) {}
  public async markExperimentPoint(userId: string, experimentPoint: string, experimentName?: string): Promise<any> {
    this.log.info(
      `Mark experiment point => Experiment: ${experimentName}, Experiment Point: ${experimentPoint} for User: ${userId}`
    );

    // find working group for user
    const userDoc = await this.userRepository.findOne({ id: userId });

    // adding experiment error when user is not defined
    if (!userDoc || (!userDoc.group && !userDoc.workingGroup)) {
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
      this.updateExclusionFromMarkExperimentPoint(userId, workingGroup, experimentPartition.experiment);
    }

    // TODO check if experiment enrollmentComplete condition is defined and to change experiment state

    // adding in monitored experiment point table
    return this.monitoredExperimentPointRepository.saveRawJson({
      id: experimentName ? `${experimentName}_${experimentPoint}` : experimentPoint,
      userId,
    });
  }

  public async getAllExperimentConditions(userId: string): Promise<any> {
    this.log.info(`Get all experiment for User Id ${userId}`);
    const usersData: any[] = await Promise.all([
      this.experimentUserService.findOne(userId),
      this.previewUserService.findOne(userId),
    ]);

    const experimentUser: ExperimentUser = usersData[0];
    const previewUser: PreviewUser = usersData[1];

    // check user validation
    if (!experimentUser) {
      // throw error user group not defined
      throw new Error(
        JSON.stringify({
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          message: `User is not defined: ${userId}}`,
        })
      );
    }

    // query all experiment and sub experiment
    let experiments: Experiment[] = [];
    if (previewUser) {
      experiments = await this.experimentRepository.getValidExperimentsWithPreview();
    } else {
      experiments = await this.experimentRepository.getValidExperiments();
    }

    // Experiment has assignment type as GROUP_ASSIGNMENT
    const groupExperiment = experiments.find(experiment => experiment.group);

    // check for group and working group
    if (groupExperiment) {
      if (!experimentUser.group || !experimentUser.workingGroup) {
        // throw error user group not defined
        throw new Error(
          JSON.stringify({
            type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
            message: `Group not defined for experiment User: ${JSON.stringify(experimentUser, undefined, 2)}`,
          })
        );
      } else {
        const keys = Object.keys(experimentUser.workingGroup);
        keys.forEach(key => {
          if (!experimentUser.group[key]) {
            throw new Error(
              JSON.stringify({
                type: SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP,
                message: `Working group not a subset of user group: ${JSON.stringify(experimentUser, undefined, 2)}`,
              })
            );
          } else {
            if (!experimentUser.group[key].includes(experimentUser.workingGroup[key])) {
              throw new Error(
                JSON.stringify({
                  type: SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP,
                  message: `Working group not a subset of user group: ${JSON.stringify(experimentUser, undefined, 2)}`,
                })
              );
            }
          }
        });
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
      userGroup = Object.keys(experimentUser.workingGroup).map((type: string) => {
        return `${type}_${experimentUser.workingGroup[type]}`;
      });

      const [userExcluded, groupExcluded] = await Promise.all([
        this.explicitIndividualExclusionRepository.find({ userId }),
        userGroup.length > 0 ? this.explicitGroupExclusionRepository.find({ where: { id: In(userGroup) } }) : [],
      ]);

      if (userExcluded.length > 0) {
        // return null if the user is excluded from the experiment
        return [];
      }

      // filter group experiment according to group excluded
      let filteredExperiments: Experiment[] = [...experiments];
      if (groupExcluded.length > 0) {
        const groupNameArray = groupExcluded.map(group => group.type);
        filteredExperiments = experiments.filter(experiment => {
          if (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
            return !groupNameArray.includes(experiment.group);
          }
          return true;
        });
      }

      const experimentIds = filteredExperiments.map(experiment => experiment.id);

      // return if no experiment
      if (experimentIds.length === 0) {
        return [];
      }

      // ============ query assignment/exclusion for user
      const allGroupIds: string[] = Object.values(experimentUser.workingGroup) || [];
      const promiseAssignmentExclusion: any[] = [
        experimentIds.length > 0 ? this.individualAssignmentRepository.findAssignment(userId, experimentIds) : [],
        allGroupIds.length > 0 && experimentIds.length > 0
          ? this.groupAssignmentRepository.findExperiment(allGroupIds, experimentIds)
          : [],
        experimentIds.length > 0 ? this.individualExclusionRepository.findExcluded(userId, experimentIds) : [],
        allGroupIds.length > 0 && experimentIds.length > 0
          ? this.groupExclusionRepository.findExcluded(allGroupIds, experimentIds)
          : [],
      ];

      const [individualAssignments, groupAssignments, individualExclusions, groupExclusions] = await Promise.all(
        promiseAssignmentExclusion
      );
      this.log.info('individualAssignments', individualAssignments);
      this.log.info('groupAssignment', groupAssignments);
      this.log.info('individualExclusion', individualExclusions);
      this.log.info('groupExclusion', groupExclusions);

      // assign remaining experiment
      const experimentAssignment = await Promise.all(
        filteredExperiments.map(experiment => {
          const individualAssignment = individualAssignments.find(assignment => {
            return assignment.experimentId === experiment.id;
          });

          const groupAssignment = groupAssignments.find(assignment => {
            return (
              assignment.experimentId === experiment.id &&
              assignment.groupId === experimentUser.workingGroup[experiment.group]
            );
          });

          const individualExclusion = individualExclusions.find(exclusion => {
            return exclusion.experimentId === experiment.id;
          });

          const groupExclusion = groupExclusions.find(exclusion => {
            return (
              exclusion.experimentId === experiment.id &&
              exclusion.groupId === experimentUser.workingGroup[experiment.group]
            );
          });

          return this.assignExperiment(
            experimentUser.id,
            experimentUser.workingGroup,
            experiment,
            individualAssignment,
            groupAssignment,
            individualExclusion,
            groupExclusion
          );
        })
      );

      return filteredExperiments.reduce((accumulator, experiment, index) => {
        const assignment = experimentAssignment[index];
        const partitions = experiment.partitions.map(partition => {
          const { name, point } = partition;
          const conditionAssigned = assignment;
          return {
            name,
            point,
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

  public async updateState(
    experimentId: string,
    state: EXPERIMENT_STATE,
    user: User,
    scheduleDate?: Date
  ): Promise<Experiment> {
    if (state === EXPERIMENT_STATE.ENROLLING) {
      await this.populateExclusionTable(experimentId);
    }

    const oldExperiment = await this.experimentRepository.findOne({ id: experimentId }, { select: ['state', 'name'] });
    let data: AuditLogData = {
      experimentId,
      experimentName: oldExperiment.name,
      previousState: oldExperiment.state,
      newState: state,
    };
    if (scheduleDate) {
      data = { ...data, startOn: scheduleDate };
    }
    // add experiment audit logs
    this.experimentAuditLogRepository.saveRawJson(EXPERIMENT_LOG_TYPE.EXPERIMENT_STATE_CHANGED, data, user);

    // update experiment
    const updatedState = await this.experimentRepository.updateState(experimentId, state, scheduleDate);

    // updating experiment schedules here
    this.updateExperimentSchedules(experimentId);

    return updatedState;
  }

  private async updateExperimentSchedules(experimentId: string): Promise<void> {
    const experiment = await this.experimentRepository.findByIds([experimentId]);
    if (experiment.length > 0) {
      await this.scheduledJobService.updateExperimentSchedules(experiment[0]);
    }
  }

  private async populateExclusionTable(experimentId: string): Promise<void> {
    // query all sub-experiment
    const experiment: Experiment = await this.experimentRepository.findOne({
      where: { id: experimentId },
      relations: ['partitions'],
    });

    const { consistencyRule, group } = experiment;
    const subExperiments = experiment.partitions.map(({ id, point }) => {
      return { experimentId: id, experimentPoint: point };
    });

    // query all monitored experiment point for this experiment Id
    const monitoredExperimentPoints = await this.monitoredExperimentPointRepository.find(subExperiments as any);
    const uniqueUserIds = new Set(
      monitoredExperimentPoints.map((monitoredPoint: MonitoredExperimentPoint) => monitoredPoint.userId)
    );

    // end the loop if no users
    if (uniqueUserIds.size === 0) {
      return;
    }

    // populate Individual and Group Exclusion Table
    if (consistencyRule === CONSISTENCY_RULE.GROUP) {
      // query all user information
      const userDetails = await this.userRepository.findByIds([...uniqueUserIds]);
      const groupsToExclude = new Set(
        userDetails.map(userDetail => {
          return userDetail.workingGroup[group];
        })
      );

      // group exclusion documents
      const groupExclusionDocs = [...groupsToExclude].map(groupId => {
        return {
          experimentId,
          groupId,
        };
      });

      await this.groupExclusionRepository.saveRawJson(groupExclusionDocs);
    }

    if (consistencyRule === CONSISTENCY_RULE.INDIVIDUAL || consistencyRule === CONSISTENCY_RULE.GROUP) {
      // individual exclusion document
      const individualExclusionDocs = [...uniqueUserIds].map(userId => {
        return { userId, experimentId };
      });
      await this.individualExclusionRepository.saveRawJson(individualExclusionDocs);
    }
  }

  private async updateExclusionFromMarkExperimentPoint(
    userId: string,
    userEnvironment: any,
    experiment: Experiment
  ): Promise<void> {
    const { state, consistencyRule, id, group } = experiment;

    const assignmentPromise: Array<Promise<any>> = [
      // query individual assignment for user
      this.individualAssignmentRepository.findAssignment(userId, [id]),
      // query group assignment
      this.groupAssignmentRepository.findExperiment([userEnvironment[experiment.group]], [id]),
      // query group exclusion
      this.groupExclusionRepository.findExcluded([userEnvironment[experiment.group]], [id]),
    ];
    const [individualAssignments, groupAssignments, groupExcluded] = await Promise.all(assignmentPromise);

    if (consistencyRule !== CONSISTENCY_RULE.EXPERIMENT) {
      if (state === EXPERIMENT_STATE.ENROLLING) {
        if (groupExcluded.length > 0) {
          this.individualExclusionRepository.saveRawJson([
            {
              experimentId: id,
              userId,
            },
          ]);
        }
      } else if (state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE) {
        if (consistencyRule === CONSISTENCY_RULE.INDIVIDUAL || consistencyRule === CONSISTENCY_RULE.GROUP) {
          if (individualAssignments.length === 0) {
            this.individualExclusionRepository.saveRawJson([
              {
                experimentId: id,
                userId,
              },
            ]);
          }
        }
        if (consistencyRule === CONSISTENCY_RULE.GROUP) {
          if (groupAssignments.length === 0) {
            this.groupExclusionRepository.saveRawJson([
              {
                experimentId: id,
                groupId: userEnvironment[group],
              },
            ]);
          }
        }
      }
    }
  }

  private async assignExperiment(
    userId: string,
    userEnvironment: any,
    experiment: Experiment,
    individualAssignment: IndividualAssignment | undefined,
    groupAssignment: GroupAssignment | undefined,
    individualExclusion: IndividualExclusion | undefined,
    groupExclusion: GroupExclusion | undefined
  ): Promise<ExperimentCondition | void> {
    if (experiment.state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE && userId) {
      if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
        if (individualAssignment) {
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
          const condition = experiment.conditions.find(key => key.id === experiment.revertTo);
          return condition;
        }
      }
    } else if (
      (experiment.state === EXPERIMENT_STATE.ENROLLING || experiment.state === EXPERIMENT_STATE.PREVIEW) &&
      userId
    ) {
      if (individualAssignment) {
        return individualAssignment.condition;
      } else if (individualExclusion) {
        return;
      } else if (groupExclusion) {
        return;
      } else if (groupAssignment) {
        // add entry in individual assignment
        this.individualAssignmentRepository.saveRawJson({
          experimentId: experiment.id,
          userId,
          condition: groupAssignment.condition,
        });
        return groupAssignment.condition;
      } else {
        const randomConditions = this.weightedRandom(
          experiment.conditions.map(condition => condition.assignmentWeight)
        );
        const experimentalCondition = experiment.conditions[randomConditions];
        // assignment operations will happen here
        if (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
          await Promise.all([
            this.groupAssignmentRepository.saveRawJson({
              experimentId: experiment.id,
              groupId: userEnvironment[experiment.group],
              condition: experimentalCondition,
            }),
            this.individualAssignmentRepository.saveRawJson({
              experimentId: experiment.id,
              userId,
              condition: experimentalCondition,
            }),
          ]);
          return experimentalCondition;
        } else if (experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL) {
          await this.individualAssignmentRepository.saveRawJson({
            experimentId: experiment.id,
            userId,
            condition: experimentalCondition,
          });
          return experimentalCondition;
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
