import {
  getSimpleIndividualExperiment, getSimpleGroupExperiment, getFactorialIndividualExperiment, getFactorialGroupExperiment, getSimpleDPExperiment, getSimpleExperimentDecisionPoint
} from './raw';
import { CONSISTENCY_RULE, ASSIGNMENT_UNIT, POST_EXPERIMENT_RULE, EXPERIMENT_STATE } from 'upgrade_types';

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

export const simpleDPExperiment = {
  ...getSimpleDPExperiment()
};

export const simpleExperimentDecisionPoint = {
  ...getSimpleExperimentDecisionPoint()
}