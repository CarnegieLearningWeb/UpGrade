import { EXPERIMENT_TYPE, FILTER_MODE } from 'upgrade_types';

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

export const simpleIndividualExperiment = {
  createdAt: "2023-06-01T18:44:41.153Z",
  updatedAt: "2023-06-01T18:45:36.499Z",
  versionNumber: 3,
  id: "be3ae74f-370a-4015-93f3-7761d16f8b17",
  name: "Test Experiment",
  description: "Test Experiment Description",
  context: [
    "add"
  ],
  state: "enrolling",
  startOn: null,
  consistencyRule: "individual",
  assignmentUnit: "individual",
  postExperimentRule: "continue",
  enrollmentCompleteCondition: null,
  endOn: null,
  revertTo: null,
  tags: [],
  group: "teacher",
  logging: false,
  filterMode: "includeAll",
  backendVersion: "4.3.0",
  type: EXPERIMENT_TYPE.SIMPLE,
  conditions: [
    {
      createdAt: "2023-06-01T18:44:41.153Z",
      updatedAt: "2023-06-01T18:44:41.153Z",
      versionNumber: 1,
      id: "c22467b1-f0e9-4444-9517-cc03037bc079",
      twoCharacterId: "CA",
      name: "Condition A",
      description: "Condition A",
      conditionCode: "ConditionA",
      assignmentWeight: 40,
      order: 1,
      levelCombinationElements: [],
      conditionPayloads: []
    },
    {
      createdAt: "2023-06-01T18:44:41.153Z",
      updatedAt: "2023-06-01T18:44:41.153Z",
      versionNumber: 1,
      id: "d2702d3c-5e04-41a7-8766-1da8a95b72ce",
      twoCharacterId: "CB",
      name: "Condition B",
      description: "Condition B",
      conditionCode: "ConditionB",
      assignmentWeight: 60,
      order: 2,
      levelCombinationElements: [],
      conditionPayloads: []
    }
  ],
  partitions: [
    {
      createdAt: "2023-06-01T18:44:41.153Z",
      updatedAt: "2023-06-01T18:44:41.153Z",
      versionNumber: 1,
      id: "20ebe3bc-6301-4eb0-adfb-3306f5326b8e",
      twoCharacterId: "W1",
      site: "CurriculumSequence",
      target: "W1",
      description: "Decision Point on Workspace 1",
      order: 1,
      excludeIfReached: false,
      conditionPayloads: []
    }
  ],
  queries: [],
  stateTimeLogs: [
    {
      createdAt: "2023-06-01T18:45:36.501Z",
      updatedAt: "2023-06-01T18:45:36.501Z",
      versionNumber: 1,
      id: "2c271f64-a2cd-4048-8c8d-f037add0088d",
      fromState: "inactive",
      toState: "enrolling",
      timeLog: "2023-06-01T18:45:36.491Z"
    }
  ],
  factors: [],
  experimentSegmentInclusion: {
    createdAt: "2023-06-01T18:44:41.153Z",
    updatedAt: "2023-06-01T18:44:41.153Z",
    versionNumber: 1,
    segment: {
      createdAt: "2023-06-01T18:44:41.245Z",
      updatedAt: "2023-06-01T18:44:41.245Z",
      versionNumber: 1,
      id: "89246cff-c81f-4515-91f3-c033341e45b9",
      name: "be3ae74f-370a-4015-93f3-7761d16f8b17 Inclusion Segment",
      description: "be3ae74f-370a-4015-93f3-7761d16f8b17 Inclusion Segment",
      context: "add",
      type: "private",
      individualForSegment: [],
      groupForSegment: [
        {
          createdAt: "2023-06-01T18:45:12.479Z",
          updatedAt: "2023-06-01T18:45:12.479Z",
          versionNumber: 1,
          groupId: "All",
          type: "All"
        }
      ],
      subSegments: []
    }
  },
  experimentSegmentExclusion: {
    createdAt: "2023-06-01T18:44:41.153Z",
    updatedAt: "2023-06-01T18:44:41.153Z",
    versionNumber: 1,
    segment: {
      createdAt: "2023-06-01T18:44:41.267Z",
      updatedAt: "2023-06-01T18:44:41.267Z",
      versionNumber: 1,
      id: "d958bf52-7066-4594-ad8a-baf2e75324cf",
      name: "be3ae74f-370a-4015-93f3-7761d16f8b17 Exclusion Segment",
      description: "be3ae74f-370a-4015-93f3-7761d16f8b17 Exclusion Segment",
      context: "add",
      type: "private",
      individualForSegment: [],
      groupForSegment: [],
      subSegments: []
    }
  }
};

export const simpleGroupExperiment = {
  createdAt: "2023-06-02T15:03:46.960Z",
  updatedAt: "2023-06-02T15:03:55.312Z",
  versionNumber: 2,
  id: "2606ad3c-5c4a-423b-8383-1c778fd07601",
  name: "GroupTest",
  description: "",
  context: [
    "add"
  ],
  state: "enrolling",
  startOn: null,
  consistencyRule: "group",
  assignmentUnit: "group",
  postExperimentRule: "continue",
  enrollmentCompleteCondition: null,
  endOn: null,
  revertTo: null,
  tags: [],
  group: "add-group1",
  logging: false,
  filterMode: "includeAll",
  backendVersion: "4.3.0",
  type: EXPERIMENT_TYPE.SIMPLE,
  conditions: [
    {
      createdAt: "2023-06-02T15:03:46.960Z",
      updatedAt: "2023-06-02T15:03:46.960Z",
      versionNumber: 1,
      id: "bb14689d-3613-45fb-be69-bac5206eda78",
      twoCharacterId: "J8",
      name: "",
      description: null,
      conditionCode: "add-con2",
      assignmentWeight: 50,
      order: 2,
      levelCombinationElements: [],
      conditionPayloads: []
    },
    {
      createdAt: "2023-06-02T15:03:46.960Z",
      updatedAt: "2023-06-02T15:03:46.960Z",
      versionNumber: 1,
      id: "6ac66195-db5d-4ed2-b001-3c94c7c16d64",
      twoCharacterId: "8D",
      name: "",
      description: null,
      conditionCode: "add-con1",
      assignmentWeight: 50,
      order: 1,
      levelCombinationElements: [],
      conditionPayloads: []
    }
  ],
  partitions: [
    {
      createdAt: "2023-06-02T15:03:46.960Z",
      updatedAt: "2023-06-02T15:03:46.960Z",
      versionNumber: 1,
      id: "9059fb4b-361f-45a3-b5ae-982981366f95",
      twoCharacterId: "XH",
      site: "add-point1",
      target: "add-id1",
      description: "",
      order: 1,
      excludeIfReached: false,
      conditionPayloads: []
    }
  ],
  queries: [],
  stateTimeLogs: [
    {
      createdAt: "2023-06-02T15:03:55.317Z",
      updatedAt: "2023-06-02T15:03:55.317Z",
      versionNumber: 1,
      id: "e0801754-bf26-48d5-a1f0-b4d07f16ddb3",
      fromState: "inactive",
      toState: "enrolling",
      timeLog: "2023-06-02T15:03:55.300Z"
    }
  ],
  factors: [],
  experimentSegmentInclusion: {
    createdAt: "2023-06-02T15:03:46.960Z",
    updatedAt: "2023-06-02T15:03:46.960Z",
    versionNumber: 1,
    segment: {
      createdAt: "2023-06-02T15:03:47.066Z",
      updatedAt: "2023-06-02T15:03:47.066Z",
      versionNumber: 1,
      id: "89246cff-c81f-4515-91f3-c033341e45b9",
      name: "2606ad3c-5c4a-423b-8383-1c778fd07601 Inclusion Segment",
      description: "2606ad3c-5c4a-423b-8383-1c778fd07601 Inclusion Segment",
      context: "add",
      type: "private",
      individualForSegment: [],
      groupForSegment: [
        {
          createdAt: "2023-06-02T15:03:47.066Z",
          updatedAt: "2023-06-02T15:03:47.066Z",
          versionNumber: 1,
          groupId: "All",
          type: "All"
        }
      ],
      subSegments: []
    }
  },
  experimentSegmentExclusion: {
    createdAt: "2023-06-02T15:03:46.960Z",
    updatedAt: "2023-06-02T15:03:46.960Z",
    versionNumber: 1,
    segment: {
      createdAt: "2023-06-02T15:03:47.095Z",
      updatedAt: "2023-06-02T15:03:47.095Z",
      versionNumber: 1,
      id: "d958bf52-7066-4594-ad8a-baf2e75324cf",
      name: "2606ad3c-5c4a-423b-8383-1c778fd07601 Exclusion Segment",
      description: "2606ad3c-5c4a-423b-8383-1c778fd07601 Exclusion Segment",
      context: "add",
      type: "private",
      individualForSegment: [],
      groupForSegment: [],
      subSegments: []
    }
  }
}



export const factorialIndividualExperiment = {
  createdAt: "2023-06-01T14:59:53.935Z",
  updatedAt: "2023-06-01T14:59:53.935Z",
  versionNumber: 1,
  id: "edf54471-5266-4a52-a058-90fac2d03678",
  name: "Factors with same Decision Points",
  description: "",
  context: [
    "add"
  ],
  state: "enrolling",
  startOn: null,
  consistencyRule: "individual",
  assignmentUnit: "individual",
  postExperimentRule: "continue",
  enrollmentCompleteCondition: null,
  endOn: null,
  revertTo: null,
  tags: [],
  group: null,
  logging: false,
  filterMode: "includeAll",
  backendVersion: "4.3.0",
  type: EXPERIMENT_TYPE.FACTORIAL,
  conditions: [
    {
      createdAt: "2023-06-01T14:59:53.935Z",
      updatedAt: "2023-06-01T14:59:53.935Z",
      versionNumber: 1,
      id: "6dd63ad9-f121-4d95-8d27-08a80e9560a4",
      twoCharacterId: "5H",
      name: "",
      description: null,
      conditionCode: "Shape=Circle; Color=Red",
      assignmentWeight: 50,
      order: 1,
      levelCombinationElements: [
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "e9a7923f-8c66-466c-a34c-a07f3d781b23",
          level: {
            createdAt: "2023-06-01T14:59:53.935Z",
            updatedAt: "2023-06-01T14:59:53.935Z",
            versionNumber: 1,
            id: "11111111-1111-4a52-a058-90fac2d03679",
            name: "Circle",
            description: null,
            payloadValue: null,
            payloadType: "string",
            order: 1
          }
        },
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "3be0fcc2-20c7-46e2-ac84-7d85104a2b57",
          level: {
            createdAt: "2023-06-01T14:59:53.935Z",
            updatedAt: "2023-06-01T14:59:53.935Z",
            versionNumber: 1,
            id: "33333333-1111-4a52-a058-90fac2d03679",
            name: "Red",
            description: null,
            payloadValue: null,
            payloadType: "string",
            order: 1
          }
        }
      ],
      conditionPayloads: [
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "9d753b90-1111-44b5-8acc-2483c0507ea1",
          payloadValue: "Red-Circle alias name",
          payloadType: "string"
        }
      ]
    },
    {
      createdAt: "2022-10-07T05:44:43.162Z",
      updatedAt: "2022-10-07T05:44:43.162Z",
      versionNumber: 1,
      id: "b6bdc056-34a2-4c96-8304-5f5105885211",
      twoCharacterId: "6Y",
      name: "",
      description: null,
      conditionCode: "Shape=Rectangle; Color=Blue",
      assignmentWeight: 50,
      order: 2,
      levelCombinationElements: [
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "92ea9738-679a-4f20-88fd-8b553a181944",
          level: {
            createdAt: "2023-06-01T14:59:53.935Z",
            updatedAt: "2023-06-01T14:59:53.935Z",
            versionNumber: 1,
            id: "22222222-2222-4a52-a058-90fac2d03679",
            name: "Rectangle",
            description: "description of level2",
            payloadValue: "Square - rectangle alias",
            payloadType: "string",
            order: 2
          }
        },
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "78c8afa0-6668-41c8-9419-d9139e004536",
          level: {
            createdAt: "2023-06-01T14:59:53.935Z",
            updatedAt: "2023-06-01T14:59:53.935Z",
            versionNumber: 1,
            id: "44444444-2222-4a52-a058-90fac2d03679",
            name: "Blue",
            description: "description of level2",
            payloadValue: "Dark blue - Blue color Alias",
            payloadType: "string",
            order: 2
          }
        }
      ],
      conditionPayloads: []
    }
  ],
  partitions: [
    {
      createdAt: "2023-06-01T14:59:53.935Z",
      updatedAt: "2023-06-01T14:59:53.935Z",
      versionNumber: 1,
      id: "5e335ac8-28df-463d-86bb-837dcd8240c4",
      twoCharacterId: "JU",
      site: "geometry",
      target: "color_shape",
      description: "",
      order: 1,
      excludeIfReached: false,
      conditionPayloads: []
    }
  ],
  queries: [],
  stateTimeLogs: [],
  factors: [
    {
      createdAt: "2023-06-01T14:59:53.935Z",
      updatedAt: "2023-06-01T14:59:53.935Z",
      versionNumber: 1,
      id: "d24f90ec-8126-4c20-a121-135dba12ba03",
      name: "Shape",
      order: 2,
      description: "",
      levels: [
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "22222222-2222-4a52-a058-90fac2d03679",
          name: "Rectangle",
          description: "description of level2",
          payloadValue: "Square - rectangle alias",
          payloadType: "string",
          order: 2
        },
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "11111111-1111-4a52-a058-90fac2d03679",
          name: "Circle",
          description: null,
          payloadValue: null,
          payloadType: "string",
          order: 1
        }
      ]
    },
    {
      createdAt: "2023-06-01T14:59:53.935Z",
      updatedAt: "2023-06-01T14:59:53.935Z",
      versionNumber: 1,
      id: "7fb8a214-a394-4ac1-9a65-4afeb77054e7",
      name: "Color",
      order: 1,
      description: "",
      levels: [
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "44444444-2222-4a52-a058-90fac2d03679",
          name: "Blue",
          description: "description of level2",
          payloadValue: "Dark blue - Blue color Alias",
          payloadType: "string",
          order: 2
        },
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "33333333-1111-4a52-a058-90fac2d03679",
          name: "Red",
          description: null,
          payloadValue: null,
          payloadType: "string",
          order: 1
        }
      ]
    }
  ],
  experimentSegmentInclusion: {
    createdAt: "2023-06-01T14:59:53.935Z",
    updatedAt: "2023-06-01T14:59:53.935Z",
    versionNumber: 1,
    segment: {
      createdAt: "2023-06-01T14:59:53.945Z",
      updatedAt: "2023-06-01T14:59:53.945Z",
      versionNumber: 1,
      id: "89246cff-c81f-4515-91f3-c033341e45b9",
      name: "edf54471-5266-4a52-a058-90fac2d03678 Inclusion Segment",
      description: "edf54471-5266-4a52-a058-90fac2d03678 Inclusion Segment",
      context: "add",
      type: "private",
      individualForSegment: [],
      groupForSegment: [],
      subSegments: []
    }
  },
  experimentSegmentExclusion: {
    createdAt: "2023-06-01T14:59:53.935Z",
    updatedAt: "2023-06-01T14:59:53.935Z",
    versionNumber: 1,
    segment: {
      createdAt: "2023-06-01T14:59:53.956Z",
      updatedAt: "2023-06-01T14:59:53.956Z",
      versionNumber: 1,
      id: "d958bf52-7066-4594-ad8a-baf2e75324cf",
      name: "edf54471-5266-4a52-a058-90fac2d03678 Exclusion Segment",
      description: "edf54471-5266-4a52-a058-90fac2d03678 Exclusion Segment",
      context: "add",
      type: "private",
      individualForSegment: [],
      groupForSegment: [],
      subSegments: []
    }
  }
};

export const factorialGroupExperiment = {
  createdAt: "2023-06-05T19:27:30.011Z",
  updatedAt: "2023-06-05T19:27:36.139Z",
  versionNumber: 2,
  id: "eb7c6a0d-4b3a-4426-a135-1c56c53d3b88",
  name: "Factorial Group Test",
  description: "",
  context: [
    "add"
  ],
  state: "enrolling",
  startOn: null,
  consistencyRule: "group",
  assignmentUnit: "group",
  postExperimentRule: "continue",
  enrollmentCompleteCondition: null,
  endOn: null,
  revertTo: null,
  tags: [],
  group: "add-group1",
  logging: false,
  filterMode: "includeAll",
  backendVersion: "4.3.0",
  type: EXPERIMENT_TYPE.FACTORIAL,
  conditions: [
    {
      createdAt: "2023-06-01T14:59:53.935Z",
      updatedAt: "2023-06-01T14:59:53.935Z",
      versionNumber: 1,
      id: "6dd63ad9-f121-4d95-8d27-08a80e9560a4",
      twoCharacterId: "5H",
      name: "",
      description: null,
      conditionCode: "Shape=Circle; Color=Red",
      assignmentWeight: 50,
      order: 1,
      levelCombinationElements: [
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "e9a7923f-8c66-466c-a34c-a07f3d781b23",
          level: {
            createdAt: "2023-06-01T14:59:53.935Z",
            updatedAt: "2023-06-01T14:59:53.935Z",
            versionNumber: 1,
            id: "11111111-1111-4a52-a058-90fac2d03679",
            name: "Circle",
            description: null,
            payloadValue: null,
            payloadType: "string",
            order: 1
          }
        },
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "3be0fcc2-20c7-46e2-ac84-7d85104a2b57",
          level: {
            createdAt: "2023-06-01T14:59:53.935Z",
            updatedAt: "2023-06-01T14:59:53.935Z",
            versionNumber: 1,
            id: "33333333-1111-4a52-a058-90fac2d03679",
            name: "Red",
            description: null,
            payloadValue: null,
            payloadType: "string",
            order: 1
          }
        }
      ],
      conditionPayloads: [
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "9d753b90-1111-44b5-8acc-2483c0507ea1",
          payloadValue: "Red-Circle alias name",
          payloadType: "string"
        }
      ]
    },
    {
      createdAt: "2022-10-07T05:44:43.162Z",
      updatedAt: "2022-10-07T05:44:43.162Z",
      versionNumber: 1,
      id: "b6bdc056-34a2-4c96-8304-5f5105885211",
      twoCharacterId: "6Y",
      name: "",
      description: null,
      conditionCode: "Shape=Rectangle; Color=Blue",
      assignmentWeight: 50,
      order: 2,
      levelCombinationElements: [
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "92ea9738-679a-4f20-88fd-8b553a181944",
          level: {
            createdAt: "2023-06-01T14:59:53.935Z",
            updatedAt: "2023-06-01T14:59:53.935Z",
            versionNumber: 1,
            id: "22222222-2222-4a52-a058-90fac2d03679",
            name: "Rectangle",
            description: "description of level2",
            payloadValue: "Square - rectangle alias",
            payloadType: "string",
            order: 2
          }
        },
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "78c8afa0-6668-41c8-9419-d9139e004536",
          level: {
            createdAt: "2023-06-01T14:59:53.935Z",
            updatedAt: "2023-06-01T14:59:53.935Z",
            versionNumber: 1,
            id: "44444444-2222-4a52-a058-90fac2d03679",
            name: "Blue",
            description: "description of level2",
            payloadValue: "Dark blue - Blue color Alias",
            payloadType: "string",
            order: 2
          }
        }
      ],
      conditionPayloads: []
    }
  ],
  partitions: [
    {
      createdAt: "2023-06-01T14:59:53.935Z",
      updatedAt: "2023-06-01T14:59:53.935Z",
      versionNumber: 1,
      id: "5e335ac8-28df-463d-86bb-837dcd8240c4",
      twoCharacterId: "JU",
      site: "geometry",
      target: "color_shape",
      description: "",
      order: 1,
      excludeIfReached: false,
      conditionPayloads: []
    }
  ],
  queries: [],
  stateTimeLogs: [],
  factors: [
    {
      createdAt: "2023-06-01T14:59:53.935Z",
      updatedAt: "2023-06-01T14:59:53.935Z",
      versionNumber: 1,
      id: "d24f90ec-8126-4c20-a121-135dba12ba03",
      name: "Shape",
      order: 2,
      description: "",
      levels: [
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "22222222-2222-4a52-a058-90fac2d03679",
          name: "Rectangle",
          description: "description of level2",
          payloadValue: "Square - rectangle alias",
          payloadType: "string",
          order: 2
        },
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "11111111-1111-4a52-a058-90fac2d03679",
          name: "Circle",
          description: null,
          payloadValue: null,
          payloadType: "string",
          order: 1
        }
      ]
    },
    {
      createdAt: "2023-06-01T14:59:53.935Z",
      updatedAt: "2023-06-01T14:59:53.935Z",
      versionNumber: 1,
      id: "7fb8a214-a394-4ac1-9a65-4afeb77054e7",
      name: "Color",
      order: 1,
      description: "",
      levels: [
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "44444444-2222-4a52-a058-90fac2d03679",
          name: "Blue",
          description: "description of level2",
          payloadValue: "Dark blue - Blue color Alias",
          payloadType: "string",
          order: 2
        },
        {
          createdAt: "2023-06-01T14:59:53.935Z",
          updatedAt: "2023-06-01T14:59:53.935Z",
          versionNumber: 1,
          id: "33333333-1111-4a52-a058-90fac2d03679",
          name: "Red",
          description: null,
          payloadValue: null,
          payloadType: "string",
          order: 1
        }
      ]
    }
  ],
  experimentSegmentInclusion: {
    createdAt: "2023-06-01T14:59:53.935Z",
    updatedAt: "2023-06-01T14:59:53.935Z",
    versionNumber: 1,
    segment: {
      createdAt: "2023-06-01T14:59:53.945Z",
      updatedAt: "2023-06-01T14:59:53.945Z",
      versionNumber: 1,
      id: "89246cff-c81f-4515-91f3-c033341e45b9",
      name: "edf54471-5266-4a52-a058-90fac2d03678 Inclusion Segment",
      description: "edf54471-5266-4a52-a058-90fac2d03678 Inclusion Segment",
      context: "add",
      type: "private",
      individualForSegment: [],
      groupForSegment: [],
      subSegments: []
    }
  },
  experimentSegmentExclusion: {
    createdAt: "2023-06-01T14:59:53.935Z",
    updatedAt: "2023-06-01T14:59:53.935Z",
    versionNumber: 1,
    segment: {
      createdAt: "2023-06-01T14:59:53.956Z",
      updatedAt: "2023-06-01T14:59:53.956Z",
      versionNumber: 1,
      id: "d958bf52-7066-4594-ad8a-baf2e75324cf",
      name: "edf54471-5266-4a52-a058-90fac2d03678 Exclusion Segment",
      description: "edf54471-5266-4a52-a058-90fac2d03678 Exclusion Segment",
      context: "add",
      type: "private",
      individualForSegment: [],
      groupForSegment: [],
      subSegments: []
    }
  }
};

const simpleDPExperiment = 
  {
    createdAt: "2023-06-09T17:37:38.216Z",
    updatedAt: "2023-06-09T17:37:38.216Z",
    versionNumber: 1,
    id: "c4410cc0-c458-45c5-9da5-8b6fea500dd2",
    twoCharacterId: "55",
    site: "add-point1",
    target: "add-id1",
    description: "",
    order: 1,
    excludeIfReached: false,
    experiment: {
      createdAt: "2023-06-09T17:37:38.216Z",
      updatedAt: "2023-06-09T18:11:10.092Z",
      versionNumber: 3,
      id: "1c7fe9c1-d43a-4ec7-8a42-16d4bc9d1d6c",
      name: "test",
      description: "",
      context: [
        "add"
      ],
      state: "enrolling",
      startOn: null,
      consistencyRule: "individual",
      assignmentUnit: "individual",
      postExperimentRule: "continue",
      enrollmentCompleteCondition: null,
      endOn: null,
      revertTo: null,
      tags: [],
      group: null,
      logging: false,
      filterMode: "includeAll",
      backendVersion: "4.3.0",
      type: "Simple"
    }
  };

const withinSubjectDPExperiment = {
  createdAt: "2023-06-15T17:59:08.165Z",
  updatedAt: "2023-06-15T17:59:08.165Z",
  versionNumber: 1,
  id: "e8f72624-0cba-4b9b-92c4-ef68bef56086",
  twoCharacterId: "XR",
  site: "SelectSection",
  target: "absolute_value_plot_equality",
  description: "",
  order: 1,
  excludeIfReached: false,
  experiment: {
    createdAt: "2023-06-15T17:59:08.165Z",
    updatedAt: "2023-06-15T17:59:13.314Z",
    versionNumber: 2,
    id: "afcbc570-2137-4585-b890-6e96b03c2504",
    name: "test",
    description: "",
    context: [
      "assign-prog"
    ],
    state: "enrolling",
    startOn: null,
    consistencyRule: null,
    assignmentUnit: "within-subjects",
    postExperimentRule: "continue",
    enrollmentCompleteCondition: null,
    endOn: null,
    revertTo: null,
    tags: [],
    group: null,
    conditionOrder: "random",
    logging: false,
    filterMode: "includeAll",
    backendVersion: "4.3.0",
    type: "Simple"
  }
}

const simpleExperimentDecisionPoint = {
  createdAt: "2023-06-09T17:37:38.216Z",
  updatedAt: "2023-06-09T17:37:38.216Z",
  versionNumber: 1,
  id: "c4410cc0-c458-45c5-9da5-8b6fea500dd2",
  twoCharacterId: "55",
  site: "add-point1",
  target: "add-id1",
  description: "",
  order: 1,
  excludeIfReached: false,
  experiment: {
    createdAt: "2023-06-09T17:37:38.216Z",
    updatedAt: "2023-06-09T18:11:10.092Z",
    versionNumber: 3,
    id: "1c7fe9c1-d43a-4ec7-8a42-16d4bc9d1d6c",
    name: "test",
    description: "",
    context: [
      "add"
    ],
    state: "enrolling",
    startOn: null,
    consistencyRule: "individual",
    assignmentUnit: "individual",
    postExperimentRule: "continue",
    enrollmentCompleteCondition: null,
    endOn: null,
    revertTo: null,
    tags: [],
    group: null,
    logging: false,
    filterMode: "includeAll",
    backendVersion: "4.3.0",
    type: "Simple",
    partitions: [
      {
        createdAt: "2023-06-09T17:37:38.216Z",
        updatedAt: "2023-06-09T17:37:38.216Z",
        versionNumber: 1,
        id: "c4410cc0-c458-45c5-9da5-8b6fea500dd2",
        twoCharacterId: "55",
        site: "add-point1",
        target: "add-id1",
        description: "",
        order: 1,
        excludeIfReached: false
      }
    ],
    conditions: [
      {
        createdAt: "2023-06-09T17:37:38.216Z",
        updatedAt: "2023-06-09T17:37:38.216Z",
        versionNumber: 1,
        id: "d245b723-3f0c-432b-bd8e-1f44d100eae4",
        twoCharacterId: "81",
        name: "",
        description: null,
        conditionCode: "add-con1",
        assignmentWeight: 50,
        order: 2,
        levelCombinationElements: [],
        conditionPayloads: []
      },
      {
        createdAt: "2023-06-09T17:37:38.216Z",
        updatedAt: "2023-06-09T17:37:38.216Z",
        versionNumber: 1,
        id: "da0ec977-fb23-4d7d-8d34-f3c379ef5184",
        twoCharacterId: "NQ",
        name: "",
        description: null,
        conditionCode: "add-con2",
        assignmentWeight: 50,
        order: 1,
        levelCombinationElements: [],
        conditionPayloads: []
      }
    ],
    factors: [],
    experimentSegmentInclusion: {
      createdAt: "2023-06-09T18:11:05.245Z",
      updatedAt: "2023-06-09T18:11:05.245Z",
      versionNumber: 1,
      segment: {
        createdAt: "2023-06-09T18:11:05.304Z",
        updatedAt: "2023-06-09T18:11:05.304Z",
        versionNumber: 1,
        id: "9eeb0404-8fe8-4cd4-9cdd-71cf21502d9d",
        name: "1c7fe9c1-d43a-4ec7-8a42-16d4bc9d1d6c Inclusion Segment",
        description: "1c7fe9c1-d43a-4ec7-8a42-16d4bc9d1d6c Inclusion Segment",
        context: "add",
        type: "private",
        subSegments: []
      }
    },
    experimentSegmentExclusion: {
      createdAt: "2023-06-09T18:11:05.245Z",
      updatedAt: "2023-06-09T18:11:05.245Z",
      versionNumber: 1,
      segment: {
        createdAt: "2023-06-09T18:11:05.324Z",
        updatedAt: "2023-06-09T18:11:05.324Z",
        versionNumber: 1,
        id: "50d01f94-b73c-4d61-ba50-dec72721e82a",
        name: "1c7fe9c1-d43a-4ec7-8a42-16d4bc9d1d6c Exclusion Segment",
        description: "1c7fe9c1-d43a-4ec7-8a42-16d4bc9d1d6c Exclusion Segment",
        context: "add",
        type: "private",
        subSegments: []
      }
    }
  }
};

export function getRevertToExperiment() {
  return JSON.parse(JSON.stringify(revertToExperiment));
}
export function getSimpleIndividualExperiment() {
  return JSON.parse(JSON.stringify(simpleIndividualExperiment));
}

export function getSimpleGroupExperiment() {
  return JSON.parse(JSON.stringify(simpleGroupExperiment));
}

export function getFactorialIndividualExperiment() {
  return JSON.parse(JSON.stringify(factorialIndividualExperiment));
}

export function getFactorialGroupExperiment() {
  return JSON.parse(JSON.stringify(factorialGroupExperiment));
}

export function getSimpleDPExperiment() {
  return JSON.parse(JSON.stringify(simpleDPExperiment));
}

export function getSimpleExperimentDecisionPoint() {
  return JSON.parse(JSON.stringify(simpleExperimentDecisionPoint));
}

export function getWithinSubjectDPExperiment() {
  return JSON.parse(JSON.stringify(withinSubjectDPExperiment));
}
