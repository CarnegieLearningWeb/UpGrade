import {
  getSimpleIndividualExperiment, getSimpleGroupExperiment, getFactorialIndividualExperiment, getFactorialGroupExperiment, getSimpleDPExperiment, getSimpleExperimentDecisionPoint, getWithinSubjectDPExperiment
} from './raw';
import { CONSISTENCY_RULE, ASSIGNMENT_UNIT, POST_EXPERIMENT_RULE, EXPERIMENT_STATE, CONDITION_ORDER } from 'upgrade_types';

export const simpleIndividualAssignmentExperiment = {
  ...getSimpleIndividualExperiment(),
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.ENROLLING,
};

export const simpleGroupAssignmentExperiment = {
  ...getSimpleGroupExperiment(),
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.ENROLLING,
};

export const factorialIndividualAssignmentExperiment = {
  ...getFactorialIndividualExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.ENROLLING,
};

export const factorialGroupAssignmentExperiment = {
  ...getFactorialGroupExperiment(),
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.ENROLLING,
};

export const simpleWithinSubjectOrderedRoundRobinExperiment = {
  ...getSimpleIndividualExperiment(),
  assignmentUnit: ASSIGNMENT_UNIT.WITHIN_SUBJECTS,
  conditionOrder: CONDITION_ORDER.ORDERED_ROUND_ROBIN,
};

export const simpleWithinSubjectRandomRoundRobinExperiment = {
  ...getSimpleIndividualExperiment(),
  assignmentUnit: ASSIGNMENT_UNIT.WITHIN_SUBJECTS,
  conditionOrder: CONDITION_ORDER.RANDOM_ROUND_ROBIN,
};

export const simpleDPExperiment = {
  ...getSimpleDPExperiment()
};

export const simpleExperimentDecisionPoint = {
  ...getSimpleExperimentDecisionPoint()
}

export const withinSubjectDPExperiment = {
  ...getWithinSubjectDPExperiment()
}