import { experiment } from './raw';

export const inidividualAssignmentExperiment = {
  ...experiment,
  name: 'Scenario 1 - Individual Assignment Scenario',
  description: 'Individual Assignment Scenario',
  consistencyRule: 'individual',
  assignmentUnit: 'individual',
  postExperimentRule: 'continue',
  state: 'scheduled',
};

export const individualAssignmentExperimentConsistencyRuleExperiemnt = {
  ...experiment,
  name: 'Scenario 1 - Individual Assignment Scenario',
  description: 'Individual Assignment Scenario',
  consistencyRule: 'experiment',
  assignmentUnit: 'individual',
  postExperimentRule: 'revertToDefault',
  state: 'scheduled',
};
