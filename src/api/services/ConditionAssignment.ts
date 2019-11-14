import { EXPERIMENT_STATE, CONSISTENCY_RULE, ASSIGNMENT_UNIT, POST_EXPERIMENT_RULE } from '../models/Experiment';

// TODO - delete this after completing the logic
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
  individualAssignment: Assignment,
  groupAssignment: Assignment,
  individualExclusion: boolean,
  groupExclusion: boolean,
  isExcluded: boolean // when experiment is excluded
): string => {
  // Check if experiment is excluded
  if (isExcluded) {
    return 'default - from isExcluded';
  } else if (experiment.state === EXPERIMENT_STATE.CANCELLED) {
    return 'default - from cancelled';
  } else if (
    experiment.state === EXPERIMENT_STATE.INACTIVE ||
    experiment.state === EXPERIMENT_STATE.SCHEDULED ||
    experiment.state === EXPERIMENT_STATE.DEMO
  ) {
    return 'default - from experiment not started';
  } else if (experiment.state === EXPERIMENT_STATE.ENROLLMENT_COMPLETE) {
    if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
      if (individualAssignment) {
        return individualAssignment.experimentCondition;
      } else if (groupAssignment) {
        return groupAssignment.experimentCondition;
      } else {
        return 'default - from experiment complete';
      }
    } else if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.REVERT_TO_DEFAULT) {
      return 'default - from revert to default';
    }
  } else if (experiment.state === EXPERIMENT_STATE.ENROLLING) {
    if (individualAssignment) {
      return individualAssignment.experimentCondition;
    } else {
      if (individualExclusion) {
        return 'default - from individual exclusion';
      } else if (groupExclusion) {
        return 'default - from group exclusion';
      } else if (groupAssignment) {
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
          return 'default - from group groupAssignment';
        }
      } else {
        if (
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
            experiment.consistencyRule === CONSISTENCY_RULE.GROUP) ||
          experiment.consistencyRule === CONSISTENCY_RULE.EXPERIMENT
        ) {
          return 'return - random assignment and add entry in individual and group';
        } else if (
          experiment.assignmentUnit === ASSIGNMENT_UNIT.GROUP &&
          experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL
        ) {
          return 'return - random assignment and add entry in individual and group';
        } else if (
          (experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL &&
            experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL) ||
          experiment.consistencyRule === CONSISTENCY_RULE.INDIVIDUAL
        ) {
          return 'return - random assignment and add entry in individual';
        } else {
          return 'default - no assignment';
        }
      }
    }
  }
  return 'default';
};
