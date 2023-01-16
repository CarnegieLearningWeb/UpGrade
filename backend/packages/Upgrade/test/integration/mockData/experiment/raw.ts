import { FILTER_MODE } from 'upgrade_types';

export const revertToExperiment = {
  id: 'be3ae74f-370a-4015-93f3-7761d16f8b11',
  name: 'Test Experiment',
  description: 'Test Experiment Description',
  consistencyRule: 'experiment',
  assignmentUnit: 'individual',
  postExperimentRule: 'assign',
  revertTo: 'c22467b1-f0e9-4444-9517-cc03037bc079',
  state: 'inactive',
  startOn: new Date().toISOString(),
  group: 'teacher',
  context: ['home'],
  tags: [],
  queries: [],
  filterMode: FILTER_MODE.INCLUDE_ALL,
  experimentSegmentInclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
  experimentSegmentExclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
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
      site: 'CurriculumSequence',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'W1',
    },
    {
      site: 'CurriculumSequence',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'W2',
    },
    {
      site: 'CurriculumSequence',
      description: 'No Decision Point',
      twoCharacterId: 'NP',
    },
  ],
  backendVersion: '1.0.0',
  groupSatisfied: 0,
};

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
  tags: [],
  queries: [],
  filterMode: FILTER_MODE.INCLUDE_ALL,
  experimentSegmentInclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
  experimentSegmentExclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
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
      site: 'CurriculumSequence',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'W1',
      excludedIfReached: true,
    },
    {
      site: 'CurriculumSequence',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'W2',
      excludedIfReached: true,
    },
    {
      site: 'CurriculumSequence',
      description: 'No Decision Point',
      twoCharacterId: 'NP',
      excludedIfReached: true,
    },
  ],
  conditionAliases: [],
  backendVersion: '1.0.0',
  groupSatisfied: 0,
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
  tags: [],
  queries: [],
  filterMode: FILTER_MODE.INCLUDE_ALL,
  experimentSegmentInclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
  experimentSegmentExclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
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
      site: 'CurriculumSequence2',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'X1',
      excludedIfReached: true,
    },
    {
      site: 'CurriculumSequence2',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'X2',
      excludedIfReached: true,
    },
  ],
  conditionAliases: [],
  backendVersion: '1.0.0',
  groupSatisfied: 0,
};

export const experimentThird = {
  id: '3711346b-49d4-4f49-92b9-0d0ce7fa6e07',
  name: 'Test Experiment',
  description: 'Test Experiment Description',
  consistencyRule: 'individual',
  assignmentUnit: 'individual',
  postExperimentRule: 'continue',
  state: 'scheduled',
  startOn: new Date().toISOString(),
  group: 'teacher',
  context: ['home'],
  tags: [],
  queries: [],
  filterMode: FILTER_MODE.INCLUDE_ALL,
  experimentSegmentInclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
  experimentSegmentExclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
  conditions: [
    {
      id: '74684fa9-fcd8-44ef-a2d1-b5bdf96076e1',
      name: 'Condition A',
      description: 'Condition A',
      assignmentWeight: 40,
      conditionCode: 'ConditionA',
      twoCharacterId: 'AA',
    },
    {
      id: '8c7b2951-f9a7-4d2e-a1ed-0572e1ede879',
      name: 'Condition B',
      description: 'Condition B',
      assignmentWeight: 60,
      conditionCode: 'ConditionB',
      twoCharacterId: 'AB',
    },
  ],
  partitions: [
    {
      site: 'CurriculumSequence3',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'Y1',
      excludedIfReached: true,
    },
    {
      site: 'CurriculumSequence3',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'Y2',
      excludedIfReached: true,
    },
  ],
  conditionAliases: [],
  backendVersion: '1.0.0',
  groupSatisfied: 0,
};

export const experimentFourth = {
  id: '3711346b-49d4-4f49-92b9-0d0ce7fa6e08',
  name: 'Test Experiment 4',
  description: 'Test Experiment Description',
  consistencyRule: 'individual',
  assignmentUnit: 'individual',
  postExperimentRule: 'continue',
  state: 'scheduled',
  startOn: new Date().toISOString(),
  group: 'teacher',
  context: ['home'],
  tags: [],
  queries: [],
  filterMode: FILTER_MODE.INCLUDE_ALL,
  experimentSegmentInclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
  experimentSegmentExclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
  conditions: [
    {
      id: '74684fa9-fcd8-44ef-a2d1-b5bdf96076e2',
      name: 'Condition A',
      description: 'Condition A',
      assignmentWeight: 55.5,
      conditionCode: 'ConditionA',
      twoCharacterId: 'AA',
    },
    {
      id: '8c7b2951-f9a7-4d2e-a1ed-0572e1ede878',
      name: 'Condition B',
      description: 'Condition B',
      assignmentWeight: 44.5,
      conditionCode: 'ConditionB',
      twoCharacterId: 'AB',
    },
  ],
  partitions: [
    {
      site: 'CurriculumSequence3',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'Y1',
      excludedIfReached: true,
    },
    {
      site: 'CurriculumSequence3',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'Y2',
      excludedIfReached: true,
    },
  ],
  conditionAliases: [],
  backendVersion: '1.0.0',
  groupSatisfied: 0,
};

export const experimentFifth = {
  id: 'be3ae74f-370a-4015-93f3-7761d16f8b18',
  name: 'Test Experiment',
  description: 'Test Experiment Description',
  consistencyRule: 'individual',
  assignmentUnit: 'individual',
  postExperimentRule: 'continue',
  state: 'inactive',
  startOn: new Date().toISOString(),
  group: 'teacher',
  context: ['home'],
  tags: [],
  queries: [],
  filterMode: FILTER_MODE.INCLUDE_ALL,
  experimentSegmentInclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
  experimentSegmentExclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
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
      id: 'd22467b1-f0e9-4444-9517-cc03037bc079',
      site: 'CurriculumSequence',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'W1',
      excludedIfReached: true,
    },
    {
      id: 'e22467b1-f0e9-4444-9517-cc03037bc079',
      site: 'CurriculumSequence',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'W2',
      excludedIfReached: true,
    },
    {
      id: 'f22467b1-f0e9-4444-9517-cc03037bc079',
      site: 'CurriculumSequence',
      description: 'No Decision Point',
      twoCharacterId: 'NP',
      excludedIfReached: true,
    },
  ],
  conditionAliases: [
    {
      id: '9d753b90-1111-44b5-8acc-2483c0507ea0',
      aliasName: 'ConditionA_W1',
      parentCondition: 'c22467b1-f0e9-4444-9517-cc03037bc079',
      decisionPoint: 'd22467b1-f0e9-4444-9517-cc03037bc079',
    },
    {
      id: '9d753b90-1111-44b5-8acc-2483c0507ea1',
      aliasName: 'ConditionA_W2',
      parentCondition: 'c22467b1-f0e9-4444-9517-cc03037bc079',
      decisionPoint: 'e22467b1-f0e9-4444-9517-cc03037bc079',
    },
  ],
  backendVersion: '1.0.0',
  groupSatisfied: 0,
};

export const experimentSixth = {
  id: 'be3ae74f-370a-4015-93f3-7761d16f8b15',
  name: 'Competing Test Experiment',
  description: 'Overlapping Experiments with Shared DPs',
  consistencyRule: 'individual',
  assignmentUnit: 'individual',
  postExperimentRule: 'continue',
  state: 'inactive',
  startOn: new Date().toISOString(),
  group: 'teacher',
  context: ['home'],
  tags: [],
  queries: [],
  filterMode: FILTER_MODE.INCLUDE_ALL,
  experimentSegmentInclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
  experimentSegmentExclusion: { segment: { individualForSegment: [], groupForSegment: [], subSegments: [] } },
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
      id: 'd22467b1-f0e9-4444-9517-cc03037bc079',
      site: 'CurriculumSequence2',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'W1',
      excludedIfReached: true,
    },
    {
      id: 'e22467b1-f0e9-4444-9517-cc03037bc079',
      site: 'CurriculumSequence3',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'W2',
      excludedIfReached: true,
    },
  ],
  conditionAliases: [],
  backendVersion: '1.0.0',
  groupSatisfied: 0,
};

export const factorialExperiment = {
  id: 'edf54471-5266-4a52-a058-90fac2d03678',
  name: 'Factors with same Decision Points',
  description: '',
  context: ['div'],
  state: 'enrolling',
  startOn: null,
  consistencyRule: 'individual',
  assignmentUnit: 'individual',
  postExperimentRule: 'continue',
  enrollmentCompleteCondition: null,
  endOn: null,
  revertTo: null,
  tags: [],
  group: null,
  logging: false,
  filterMode: 'includeAll',
  backendVersion: '1.0.0',
  type: 'Factorial',
  partitions: [
    {
      id: '5e335ac8-28df-463d-86bb-837dcd8240c4',
      twoCharacterId: 'JU',
      site: 'geometry',
      target: 'color_shape',
      description: '',
      order: 1,
      excludeIfReached: false,
      factors: [
        {
          name: 'Color',
          order: 1,
          levels: [
            {
              id: '33333333-1111-4a52-a058-90fac2d03679',
              name: 'Red',
              order: 1,
            },
            {
              id: '44444444-2222-4a52-a058-90fac2d03679',
              name: 'Blue',
              description: 'description of level2',
              alias: 'Dark blue - Blue color Alias',
              order: 2,
            },
          ],
        },
        {
          name: 'Shape',
          order: 2,
          levels: [
            {
              id: '11111111-1111-4a52-a058-90fac2d03679',
              name: 'Circle',
              order: 1,
            },
            {
              id: '22222222-2222-4a52-a058-90fac2d03679',
              name: 'Rectangle',
              description: 'description of level2',
              alias: 'Square - rectangle alias',
              order: 2,
            },
          ],
        },
      ],
    },
  ],
  conditions: [
    {
      id: '6dd63ad9-f121-4d95-8d27-08a80e9560a4',
      twoCharacterId: '5H',
      name: '',
      description: null,
      conditionCode: null,
      assignmentWeight: 50,
      order: 1,
      levelCombinationElements: [
        {
          level: '11111111-1111-4a52-a058-90fac2d03679',
        },
        {
          level: '33333333-1111-4a52-a058-90fac2d03679',
        },
      ],
    },
    {
      createdAt: '2022-10-07T05:44:43.162Z',
      updatedAt: '2022-10-07T05:44:43.162Z',
      versionNumber: 1,
      id: 'b6bdc056-34a2-4c96-8304-5f5105885211',
      twoCharacterId: '6Y',
      name: '',
      description: null,
      conditionCode: null,
      assignmentWeight: 50,
      order: 2,
      levelCombinationElements: [
        {
          level: '22222222-2222-4a52-a058-90fac2d03679',
        },
        {
          level: '44444444-2222-4a52-a058-90fac2d03679',
        },
      ],
    },
  ],
  stateTimeLogs: [
    {
      createdAt: '2022-10-07T05:44:57.680Z',
      updatedAt: '2022-10-07T05:44:57.680Z',
      versionNumber: 1,
      id: '49dd73c2-c68a-4e46-bd2a-5473edb0da22',
      fromState: 'inactive',
      toState: 'enrolling',
      timeLog: '2022-10-07T05:44:57.673Z',
    },
  ],
  queries: [],
  experimentSegmentInclusion: {
    segment: {
      createdAt: '2022-10-07T05:44:43.184Z',
      updatedAt: '2022-10-07T05:44:43.184Z',
      versionNumber: 1,
      id: 'ba189e98-b6a9-4516-9da0-484fc61c44d6',
      name: 'edf54471-5266-4a52-a058-90fac2d03679 Inclusion Segment',
      description: 'edf54471-5266-4a52-a058-90fac2d03679 Inclusion Segment',
      context: 'add',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [],
      subSegments: [],
    },
  },
  experimentSegmentExclusion: {
    segment: {
      createdAt: '2022-10-07T05:44:43.210Z',
      updatedAt: '2022-10-07T05:44:43.210Z',
      versionNumber: 1,
      id: '7c698b1e-74ed-4429-8c73-90b86c95ca33',
      name: 'edf54471-5266-4a52-a058-90fac2d03679 Exclusion Segment',
      description: 'edf54471-5266-4a52-a058-90fac2d03679 Exclusion Segment',
      context: 'add',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [],
      subSegments: [],
    },
  },
  conditionAliases: [
    {
      id: '9d753b90-1111-44b5-8acc-2483c0507ea1',
      aliasName: 'Red-Circle alias name',
      parentCondition: '6dd63ad9-f121-4d95-8d27-08a80e9560a4',
    },
  ],
};

export function getRevertToExperiment() {
  return JSON.parse(JSON.stringify(revertToExperiment));
}
export function getExperiment() {
  return JSON.parse(JSON.stringify(experiment));
}

export function getSecondExperiment() {
  return JSON.parse(JSON.stringify(experimentSecond));
}

export function getThirdExperiment() {
  return JSON.parse(JSON.stringify(experimentThird));
}

export function getFourthExperiment() {
  return JSON.parse(JSON.stringify(experimentFourth));
}

export function getFifthExperiment() {
  return JSON.parse(JSON.stringify(experimentFifth));
}

export function getSixthExperiment() {
  return JSON.parse(JSON.stringify(experimentSixth));
}

export function getFactorialExperiment() {
  return JSON.parse(JSON.stringify(factorialExperiment));
}
