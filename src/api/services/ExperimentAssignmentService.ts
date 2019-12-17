import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentSegmentRepository } from '../repositories/ExperimentSegmentRepository';
import { EXPERIMENT_STATE, CONSISTENCY_RULE, POST_EXPERIMENT_RULE, ASSIGNMENT_UNIT } from 'ees_types';
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
import { UserRepository } from '../repositories/UserRepository';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import { Experiment } from '../models/Experiment';
import { ExplicitIndividualExclusionRepository } from '../repositories/ExplicitIndividualExclusionRepository';
import { ExplicitGroupExclusionRepository } from '../repositories/ExplicitGroupExclusionRepository';

@Service()
export class ExperimentAssignmentService {
  constructor(
    @OrmRepository() private experimentRepository: ExperimentRepository,
    @OrmRepository()
    private experimentSegmentRepository: ExperimentSegmentRepository,
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
    private userRepository: UserRepository,
    @OrmRepository()
    private explicitIndividualExclusionRepository: ExplicitIndividualExclusionRepository,
    @OrmRepository()
    private explicitGroupExclusionRepository: ExplicitGroupExclusionRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {}
  public async markExperimentPoint(
    experimentId: string,
    experimentPoint: string,
    userId: string,
    userEnvironment: any
  ): Promise<any> {
    this.log.info(
      `Mark experiment point => Experiment: ${experimentId}, Experiment Point: ${experimentPoint} for User: ${userId}`
    );
    // query root experiment details
    const experimentSegment = await this.experimentSegmentRepository.findOne({
      where: {
        id: experimentId,
        point: experimentPoint,
      },
      relations: ['experiment'],
    });

    if (experimentSegment) {
      // Can be shift to job queue
      this.updateExclusionFromMarkExperimentPoint(userId, userEnvironment, experimentSegment.experiment);
    }

    // TODO add in the experiments logs
    // adding in monitored experiment point table
    return this.monitoredExperimentPointRepository.saveRawJson({
      experimentId,
      experimentPoint,
      userId,
    });
  }

  public async getAllExperimentConditions(userId: string, userEnvironment: any): Promise<any> {
    this.log.info(`Get all experiment for User Id ${userId} and User Environment ${JSON.stringify(userEnvironment)}`);
    // store userId and userEnvironment
    this.userRepository.saveRawJson({
      id: userId,
      group: userEnvironment,
    });

    // query all experiment and sub experiment
    const experiments = await this.experimentRepository.getEnrollingAndEnrollmentComplete();

    const experimentIds = experiments.map(experiment => experiment.id);

    // return if no experiment
    if (experimentIds.length === 0) {
      return [];
    }

    // ============= check if user or group is excluded
    const userGroup = Object.keys(userEnvironment).map((type: string) => {
      return {
        groupId: userEnvironment[type] as string,
        type,
      };
    });
    const [individualExcluded, groupExcluded] = await Promise.all([
      this.explicitIndividualExclusionRepository.find({ userId }),
      this.explicitGroupExclusionRepository.find(userGroup as any),
    ]);

    this.log.info('individualExcluded', individualExcluded);
    this.log.info('groupExcluded', groupExcluded);
    if (individualExcluded.length > 0 || groupExcluded.length > 0) {
      return [];
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
      experiments.map(experiment => {
        const individualAssignment = individualAssignments.find(assignment => {
          return assignment.experimentId === experiment.id;
        });

        const groupAssignment = groupAssignments.find(assignment => {
          return assignment.experimentId === experiment.id && assignment.groupId === userEnvironment[experiment.group];
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

    return experiments.reduce((accumulator, experiment, index) => {
      const assignment = experimentAssignment[index];
      const segments = experiment.segments.map(segment => {
        const { name, point } = segment;
        const conditionAssigned = assignment;
        return {
          name,
          point,
          assignedCondition: conditionAssigned || {
            conditionCode: 'default',
          },
        };
      });
      return [...accumulator, ...segments];
    }, []);
  }

  public async updateState(experimentId: string, state: EXPERIMENT_STATE): Promise<Experiment> {
    // TODO populate exclusion table when state is changed to ENROLLING
    if (state === EXPERIMENT_STATE.ENROLLING) {
      await this.populateExclusionTable(experimentId);
    }
    return this.experimentRepository.updateState(experimentId, state);
  }

  private async populateExclusionTable(experimentId: string): Promise<void> {
    // query all sub-experiment
    const experiment: Experiment = await this.experimentRepository.findOne({
      where: { id: experimentId },
      relations: ['segments'],
    });

    const { consistencyRule, group } = experiment;
    const subExperiments = experiment.segments.map(({ id, point }) => {
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
  ): Promise<string> {
    if (experiment.state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE) {
      if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
        if (individualAssignment) {
          return individualAssignment.condition.id;
        } else if (individualExclusion) {
          return 'default';
        } else if (groupAssignment) {
          return groupAssignment.condition.id;
        } else if (groupExclusion) {
          return 'default';
        } else {
          return 'default';
        }
      } else if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.REVERT_TO_DEFAULT) {
        return 'default';
      }
    } else if (experiment.state === EXPERIMENT_STATE.ENROLLING) {
      if (individualAssignment) {
        return individualAssignment.condition.id;
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
        return groupAssignment.condition.id;
      } else {
        const randomConditions = Math.floor(Math.random() * experiment.conditions.length);
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
          return experimentalCondition.id;
        } else if (experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL) {
          await this.individualAssignmentRepository.saveRawJson({
            experimentId: experiment.id,
            userId,
            condition: experimentalCondition,
          });
          return experimentalCondition.id;
        }
      }
    }
    return 'default';
  }
}
