export const experiment = {
  name: 'Scenario 1 - Individual Assignment Scenario',
  description: 'Individual Assignment Scenario',
  consistencyRule: 'individual',
  assignmentUnit: 'individual',
  postExperimentRule: 'continue',
  state: 'scheduled',
  group: 'teacher',
  conditions: [
    {
      name: 'Condition A',
      description: 'Condition A',
      assignmentWeight: 0.4,
      conditionCode: 'ConditionA',
    },
    {
      name: 'Condition B',
      description: 'Condition B',
      assignmentWeight: 0.6,
      conditionCode: 'ConditionB',
    },
  ],
  segments: [
    {
      id: 'W1',
      point: 'CurriculumSequence ',
      name: 'WorkSpace 1',
      description: 'Segment on Workspace 1',
    },
    {
      id: 'W2',
      point: 'CurriculumSequence',
      name: 'Workspace 2',
      description: 'Segment on Workspace 2',
    },
  ],
};
