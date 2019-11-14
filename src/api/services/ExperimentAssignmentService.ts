import { OrmRepository } from 'typeorm-typedi-extensions';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { ExperimentSegmentRepository } from '../repositories/ExperimentSegmentRepository';
import {
  EXPERIMENT_STATE,
  CONSISTENCY_RULE,
  Experiment,
  POST_EXPERIMENT_RULE,
  ASSIGNMENT_UNIT,
} from '../models/Experiment';
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
    // TODO when experiment is not defined
    // query root experiment id
    const experiment = await this.experimentSegmentRepository.findOne({
      where: {
        id: experimentId,
        point: experimentPoint,
      },
      relations: ['experiment'],
    });

    const {
      state,
      consistencyRule,
      assignmentUnit,
      id,
      group,
    } = experiment.experiment;

    // TODO - Parallel query all of these
    // query individual assignment for user
    const individualAssignments = await this.individualAssignmentRepository.findAssignment(
      userId,
      [id]
    );

    this.log.info('individualAssignments', individualAssignments);

    // query group assignment for user according to group id
    const groupAssignments = await this.groupAssignmentRepository.findExperiment(
      [userEnvironment.class],
      [id]
    );

    this.log.info('groupAssignments', groupAssignments);

    if (!(state === EXPERIMENT_STATE.CANCELLED)) {
      if (assignmentUnit === ASSIGNMENT_UNIT.GROUP) {
        if (consistencyRule !== CONSISTENCY_RULE.EXPERIMENT) {
          if (consistencyRule === CONSISTENCY_RULE.GROUP) {
            if (groupAssignments.length === 0) {
              this.groupExclusionRepository.saveRawJson({
                experimentId: id,
                groupId: userEnvironment[group],
              });
            }
            if (
              groupAssignments.length === 0 &&
              individualAssignments.length === 0
            ) {
              this.individualExclusionRepository.saveRawJson({
                experimentId: id,
                userId,
              });
            }
          } else if (consistencyRule === CONSISTENCY_RULE.INDIVIDUAL) {
            if (
              groupAssignments.length === 0 &&
              individualAssignments.length === 0
            ) {
              this.individualExclusionRepository.saveRawJson({
                experimentId: id,
                userId,
              });
            }
          }
        }
      } else if (assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL) {
        if (consistencyRule !== CONSISTENCY_RULE.EXPERIMENT) {
          if (individualAssignments.length === 0) {
            this.individualExclusionRepository.saveRawJson({
              experimentId: id,
              userId,
            });
          }
        }
      }
    }

    // TODO add in the experiments logs
    // adding in monitored experiment point table
    return this.monitoredExperimentPointRepository.saveRawJson({
      experimentId,
      experimentPoint,
      userId,
    });
  }

  public async getAllExperimentConditions(
    userId: string,
    userEnvironment: any
  ): Promise<any> {
    // query all experiment and sub experiment
    const experiments = await this.experimentRepository.getEnrollingAndEnrollmentComplete();

    const experimentIds = experiments.map(experiment => experiment.id);

    this.log.info('experimentIds', experimentIds);

    // return if no experiment
    if (experimentIds.length === 0) {
      return [];
    }

    // TODO add explicit exclusion table query
    // TODO - Parallel query all of these
    // query individual assignment for user
    const individualAssignments = await this.individualAssignmentRepository.findAssignment(
      userId,
      experimentIds
    );
    this.log.info('individualAssignments', individualAssignments);

    // query group assignment for user according to group id
    const groupAssignments = await this.groupAssignmentRepository.findExperiment(
      [userEnvironment.class],
      experimentIds
    );

    this.log.info('groupAssignment', groupAssignments);

    // query individual exclusion for user
    const individualExclusions = await this.individualExclusionRepository.findExcluded(
      userId,
      experimentIds
    );
    this.log.info('individualExclusion', individualExclusions);

    // query group exclusion for user
    const groupExclusions = await this.groupExclusionRepository.findExcluded(
      [userEnvironment.class],
      experimentIds
    );
    this.log.info('groupExclusion', groupExclusions);

    // assign remaining experiment
    const experimentAssignment = await Promise.all(
      experiments.map(experiment => {
        const individualAssignment = individualAssignments.find(assignment => {
          return assignment.experimentId === experiment.id;
        });

        const groupAssignment = groupAssignments.find(assignment => {
          return (
            assignment.experimentId === experiment.id &&
            assignment.groupId === userEnvironment[experiment.group]
          );
        });

        const individualExclusion = individualExclusions.find(exclusion => {
          return exclusion.experimentId === experiment.id;
        });

        const groupExclusion = groupExclusions.find(exclusion => {
          return (
            exclusion.experimentId === experiment.id &&
            exclusion.groupId === userEnvironment[experiment.group]
          );
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
        const { id, point, segmentConditions } = segment;
        const conditionAssigned = segmentConditions.find(segmentCondition => {
          return segmentCondition.experimentConditionId === assignment;
        });
        return {
          id,
          point,
          assignedCondition: conditionAssigned || 'default',
        };
      });
      return [...accumulator, ...segments];
    }, []);
  }

  public updateState(experimentId: string, state: EXPERIMENT_STATE): any {
    return this.experimentRepository.updateState(experimentId, state);
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
      } else if (
        experiment.postExperimentRule === POST_EXPERIMENT_RULE.REVERT_TO_DEFAULT
      ) {
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
        const randomConditions = Math.floor(
          Math.random() * experiment.conditions.length
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
