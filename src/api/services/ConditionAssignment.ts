import { EXPERIMENT_STATE, CONSISTENCY_RULE, ASSIGNMENT_UNIT, POST_EXPERIMENT_RULE } from '../models/Experiment';

interface Experiment {
  id: string;
  point: string;
  name: string;
  description: string;
  state: EXPERIMENT_STATE;
  consistencyRule: CONSISTENCY_RULE;
  assignmentUnit: ASSIGNMENT_UNIT;
  postExperimentRule: POST_EXPERIMENT_RULE;
}

interface MarkedExperimentPoint {
  experimentId: string;
  experimentPoint: string;
}

interface Assignment {
  experimentId: string;
  experimentCondition: string;
}

interface UserEnvironment {
  userGroup: any;
}

export const getExperimentAssignment = (
  userId: string,
  userEnvironment: UserEnvironment,
  experiment: Experiment,
  markedExperimentPoint: MarkedExperimentPoint,
  individualAssignment: Assignment,
  groupAssignment: Assignment,
  isExcluded: boolean
): string => {
  // Check if experiment is excluded
  if (isExcluded) {
    return 'default';
  } else if (experiment.state === EXPERIMENT_STATE.CANCELLED) {
    return 'default';
  } else if (
    experiment.state === EXPERIMENT_STATE.INACTIVE ||
    experiment.state === EXPERIMENT_STATE.SCHEDULED ||
    experiment.state === EXPERIMENT_STATE.DEMO
  ) {
    // add experiment in markExperimentPoint
    return 'default';
  } else if (experiment.state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE) {
    if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
      if (individualAssignment) {
        return individualAssignment.experimentCondition;
      } else if (groupAssignment) {
        return groupAssignment.experimentCondition;
      } else {
        return 'default';
      }
    } else if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.REVERT_TO_DEFAULT) {
      return 'default';
    }
  } else if (experiment.state === EXPERIMENT_STATE.ENROLLING) {
    if (individualAssignment) {
      return individualAssignment.experimentCondition;
    } else {
      if (groupAssignment) {
        if (
          experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
          (experiment.consistencyRule === CONSISTENCY_RULE.GROUP ||
            experiment.consistencyRule === CONSISTENCY_RULE.EXPERIMENT)
        ) {
          return groupAssignment.experimentCondition;
        } else if (
          experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
          experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL
        ) {
          return groupAssignment.experimentCondition;
        } else {
          return 'default';
        }
      } else {
        if (
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
            experiment.consistencyRule === CONSISTENCY_RULE.GROUP) ||
          experiment.consistencyRule === CONSISTENCY_RULE.EXPERIMENT
        ) {
          return 'return random assignment and add entry in individual and group';
        } else if (
          experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
          experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL
        ) {
          return 'return random assignment and add entry in individual and group';
        } else if (
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL &&
            experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL) ||
          experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL
        ) {
          return 'return random assignment and add entry in individual';
        } else {
          return 'default';
        }
      }
    }
  }
  return 'default';
};
