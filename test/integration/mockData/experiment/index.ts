import { experiment } from './raw';
import { CONSISTENCY_RULE, ASSIGNMENT_UNIT, POST_EXPERIMENT_RULE, EXPERIMENT_STATE } from 'ees_types';

export const individualAssignmentExperiment = {
  ...experiment,
  name: 'Scenario 1 - Individual Assignment',
  description: 'Individual Assignment',
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.SCHEDULED,
};

export const individualAssignmentExperimentConsistencyRuleExperiemnt = {
  ...experiment,
  name: 'Scenario 2 - Individual Assignment',
  description: 'Individual Assignment',
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.REVERT,
  revertTo: 'default',
  state: EXPERIMENT_STATE.SCHEDULED,
};

export const groupAssignmentWithGroupConsistencyExperiment = {
  ...experiment,
  name: 'Scenario 3 - Group Assignment With Group Consistency',
  description: 'Group Assignment With Group Consistency',
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.SCHEDULED,
};

export const groupAssignmentWithIndividulaConsistencyExperiment = {
  ...experiment,
  name: 'Scenario 4 - Group Assignment With Individual Consistency',
  description: 'Group Assignment With Individual Consistency',
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.SCHEDULED,
};

export const groupAssignmentWithExperimentConsistencyExperiment = {
  ...experiment,
  name: 'Scenario 5 - Group Assignment With Experiment Consistency',
  description: 'Group Assignment With Experiment Consistency',
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.SCHEDULED,
};

export const groupAssignmentWithGroupConsistencyExperimentSwitchBeforeAssignment = {
  ...experiment,
  name: 'Scenario 6 - [Student Switch Groups] Group Assignment With Group Consistency',
  description: '[Student Switch Groups] Group Assignment With Group Consistency',
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};
