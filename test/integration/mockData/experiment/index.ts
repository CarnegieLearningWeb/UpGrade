import { experiment } from './raw';
import { CONSISTENCY_RULE, ASSIGNMENT_UNIT, POST_EXPERIMENT_RULE, EXPERIMENT_STATE } from 'ees_types';

export const individualAssignmentExperiment = {
  ...experiment,
  name: 'Scenario 1 - Individual Assignment Scenario',
  description: 'Individual Assignment Scenario',
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.SCHEDULED,
};

export const individualAssignmentExperimentConsistencyRuleExperiemnt = {
  ...experiment,
  name: 'Scenario 1 - Individual Assignment Scenario for Experiment',
  description: 'Individual Assignment Scenario for Experiment',
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.REVERT_TO_DEFAULT,
  state: EXPERIMENT_STATE.SCHEDULED,
};
