export const experiment = {
  name: 'Scenario 1 - Individual Assignment Scenario',
  description: 'Individual Assignment Scenario',
  consistencyRule: 'individual',
  assignmentUnit: 'individual',
  postExperimentRule: 'continue',
  state: 'scheduled',
  group: 'class',
  conditions: [
    {
      name: 'Condition A',
      description: 'Condition A',
      assignmentWeight: 0.4,
    },
    {
      name: 'Condition B',
      description: 'Condition B',
      assignmentWeight: 0.6,
    },
  ],
  segments: [
    {
      id: 'W1',
      point: 'CurriculumSequence ',
      name: 'WorkSpace 1',
      description: 'Segment on Workspace 1',
      segmentConditions: [
        {
          conditionCode: '[Segment W1]- ConditionA',
        },
        {
          conditionCode: '[Segment W1]- ConditionB',
        },
      ],
    },
    {
      id: 'W2',
      point: 'CurriculumSequence',
      name: 'Workspace 2',
      description: 'Segment on Workspace 2',
      segmentConditions: [
        {
          conditionCode: '[Segment W2]- ConditionA',
        },
        {
          conditionCode: '[Segment W2]- ConditionB',
        },
      ],
    },
  ],
};
