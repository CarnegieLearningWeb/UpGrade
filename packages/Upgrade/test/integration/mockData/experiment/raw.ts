export const experiment = {
  id: 'be3ae74f-370a-4015-93f3-7761d16f8b17',
  name: 'Test Experiment',
  description: 'Test Experiment Description',
  consistencyRule: 'individual',
  assignmentUnit: 'individual',
  postExperimentRule: 'continue',
  state: 'scheduled',
  startOn: new Date().toISOString(),
  group: 'teacher',
  context: ['home'],
  conditions: [
    {
      id: 'c22467b1-f0e9-4444-9517-cc03037bc079',
      name: 'Condition A',
      description: 'Condition A',
      assignmentWeight: 40,
      conditionCode: 'ConditionA',
      twoCharacterId: 'CA',
    },
    {
      id: 'd2702d3c-5e04-41a7-8766-1da8a95b72ce',
      name: 'Condition B',
      description: 'Condition B',
      assignmentWeight: 60,
      conditionCode: 'ConditionB',
      twoCharacterId: 'CB',
    },
  ],
  partitions: [
    {
      point: 'CurriculumSequence',
      name: 'W1',
      description: 'Partition on Workspace 1',
      twoCharacterId: 'W1',
    },
    {
      point: 'CurriculumSequence',
      name: 'W2',
      description: 'Partition on Workspace 2',
      twoCharacterId: 'W2',
    },
    {
      point: 'CurriculumSequence',
      description: 'No Partition',
      twoCharacterId: 'NP',
    },
  ],
};

export const experimentSecond = {
  id: '8b0e562a-029e-4680-836c-7de6b2ef6ac9',
  name: 'Test Experiment',
  description: 'Test Experiment Description',
  consistencyRule: 'individual',
  assignmentUnit: 'individual',
  postExperimentRule: 'continue',
  state: 'scheduled',
  startOn: new Date().toISOString(),
  group: 'teacher',
  context: ['home'],
  conditions: [
    {
      id: 'bb8844a9-085b-4ceb-b893-eaaea3b739af',
      name: 'Condition A',
      description: 'Condition A',
      assignmentWeight: 40,
      conditionCode: 'ConditionA',
      twoCharacterId: 'BA',
    },
    {
      id: '439a6fef-901d-4f0c-bca8-25f06e9e6262',
      name: 'Condition B',
      description: 'Condition B',
      assignmentWeight: 60,
      conditionCode: 'ConditionB',
      twoCharacterId: 'BB',
    },
  ],
  partitions: [
    {
      point: 'CurriculumSequence2',
      name: 'W1',
      description: 'Partition on Workspace 1',
      twoCharacterId: 'X1',
    },
    {
      point: 'CurriculumSequence2',
      name: 'W2',
      description: 'Partition on Workspace 2',
      twoCharacterId: 'X2',
    },
  ],
};
