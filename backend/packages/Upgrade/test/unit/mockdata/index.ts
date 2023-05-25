import {
  getExperiment, getFirstFactorialExperiment,
} from './raw';
import { CONSISTENCY_RULE, ASSIGNMENT_UNIT, POST_EXPERIMENT_RULE, EXPERIMENT_STATE } from 'upgrade_types';

export const individualAssignmentExperiment = {
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.ENROLLING,
};


export const firstFactorialExperiment = {
  ...getFirstFactorialExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.ENROLLING,
};