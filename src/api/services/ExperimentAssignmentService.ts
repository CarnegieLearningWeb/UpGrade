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
    public scheduledJobService: ScheduledJobService,
    @Logger(__filename) private log: LoggerInterface
  ) {}
  public async markExperimentPoint(
    experimentName: string,
    experimentPoint: string,
    userId: string,
    userEnvironment: any
  ): Promise<any> {
    this.log.info(
      `Mark experiment point => Experiment: ${experimentName}, Experiment Point: ${experimentPoint} for User: ${userId}, userEnvironment: ${userEnvironment}`
    );

    // query root experiment details
    const experimentPartition = await this.experimentPartitionRepository.findOne({
      where: {
        id: `${experimentName}_${experimentPoint}`,
      },
      relations: ['experiment'],
    });

    if (experimentPartition) {
      this.updateExclusionFromMarkExperimentPoint(userId, userEnvironment, experimentPartition.experiment);
    }

    // TODO check if experiment enrollmentComplete condition is defined and to change experiment state

    // adding in monitored experiment point table
    return this.monitoredExperimentPointRepository.saveRawJson({
      id: `${experimentName}_${experimentPoint}`,
      userId,
    });
  }

  public async getAllExperimentConditions(userId: string, userEnvironment: any): Promise<any> {
    try {
      this.log.info(`Get all experiment for User Id ${userId} and User Environment ${JSON.stringify(userEnvironment)}`);
      // store userId and userEnvironment
      this.userRepository.saveRawJson({
        id: userId,
        group: userEnvironment,
      });

      // query all experiment and sub experiment
      const experiments = await this.experimentRepository.getValidExperiments();

      const experimentIds = experiments.map(experiment => experiment.id);

      // return if no experiment
      if (experimentIds.length === 0) {
        return [];
      }

      // ============= check if user or group is excluded
      const userGroup = Object.keys(userEnvironment).map((type: string) => {
        return `${type}_${userEnvironment[type]}`;
      });
      const [userExcluded, groupExcluded, previewUser] = await Promise.all([
        this.explicitIndividualExclusionRepository.find({ userId }),
        this.explicitGroupExclusionRepository.find({ where: { id: In(userGroup) } }),
        this.previewUserService.findOne(userId),
      ]);

      this.log.info('userExcluded', userExcluded);

      if (userExcluded.length > 0) {
        // return null if the user is excluded from the experiment
        return [];
      }

      // filter group experiment according to group excluded
      let filteredExperiments: Experiment[] = [...experiments];
      this.log.info('groupExcluded', groupExcluded);
      if (groupExcluded.length > 0) {
        const groupNameArray = groupExcluded.map(group => group.type);
        filteredExperiments = experiments.filter(experiment => {
          if (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
            return !groupNameArray.includes(experiment.group);
          }
          return true;
        });
      }

      // filter preview experiment is user is not a PreviewUser
      if (!previewUser) {
        filteredExperiments = filteredExperiments.filter(experiment => {
          return experiment.state !== EXPERIMENT_STATE.PREVIEW;
        });
      }

      // ============ query assignment/exclusion for user
      const allGroupIds: string[] = Object.values(userEnvironment);
      const promiseAssignmentExclusion: any[] = [
        this.individualAssignmentRepository.findAssignment(userId, experimentIds),
        this.groupAssignmentRepository.findExperiment(allGroupIds, experimentIds),
        this.individualExclusionRepository.findExcluded(userId, experimentIds),
        this.groupExclusionRepository.findExcluded(allGroupIds, experimentIds),
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
              assignment.experimentId === experiment.id && assignment.groupId === userEnvironment[experiment.group]
            );
          });

          const individualExclusion = individualExclusions.find(exclusion => {
            return exclusion.experimentId === experiment.id;
          });

          const groupExclusion = groupExclusions.find(exclusion => {
            return exclusion.experimentId === experiment.id && exclusion.groupId === userEnvironment[experiment.group];
          });

          return this.assignExperiment(
            userId,
            userEnvironment,
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

  public async updateState(experimentId: string, state: EXPERIMENT_STATE, user: User): Promise<Experiment> {
    if (state === EXPERIMENT_STATE.ENROLLING) {
      await this.populateExclusionTable(experimentId);
    }

    const oldExperiment = await this.experimentRepository.findOne({ id: experimentId }, { select: ['state', 'name'] });
    const data: AuditLogData = {
      experimentId,
      experimentName: oldExperiment.name,
      previousState: oldExperiment.state,
      newState: state,
    };
    // add experiment audit logs
    this.experimentAuditLogRepository.saveRawJson(EXPERIMENT_LOG_TYPE.EXPERIMENT_STATE_CHANGED, data, user);

    // update experiment
    const updatedState = await this.experimentRepository.updateState(experimentId, state);

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
          return userDetail.group[group];
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
  ): Promise<ExperimentCondition | string> {
    if (experiment.state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE) {
      if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
        if (individualAssignment) {
          return individualAssignment.condition;
        } else if (individualExclusion) {
          return 'default';
        } else if (groupAssignment) {
          return groupAssignment.condition;
        } else if (groupExclusion) {
          return 'default';
        } else {
          return 'default';
        }
      } else if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.REVERT) {
        if (!experiment.revertTo) {
          return 'default';
        } else {
          const condition = experiment.conditions.find(key => key.id === experiment.revertTo);
          return condition;
        }
      }
    } else if (experiment.state === EXPERIMENT_STATE.ENROLLING) {
      if (individualAssignment) {
        return individualAssignment.condition;
      } else if (individualExclusion) {
        return 'default';
      } else if (groupExclusion) {
        return 'default';
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
    return 'default';
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
