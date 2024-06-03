import {
  getExperiment,
  getRevertToExperiment,
  getSecondExperiment,
  getThirdExperiment,
  getFourthExperiment,
  getFifthExperiment,
  getSixthExperiment,
  getFirstFactorialExperiment,
  getSecondFactorialExperiment,
} from './raw';
import {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE,
  CONDITION_ORDER,
} from 'upgrade_types';

export const individualAssignmentExperiment = {
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const individualAssignmentExperimentConsistencyRuleRevertToExperiment = {
  ...getRevertToExperiment(),
};

export const individualAssignmentExperimentConsistencyRuleExperiment = {
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.ASSIGN,
  revertTo: getExperiment().conditions[0].id,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const groupAssignmentWithGroupConsistencyExperiment = {
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const groupAssignmentWithGroupConsistencyExperiment2 = {
  ...getSecondExperiment(),
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const groupAssignmentWithIndividualConsistencyExperiment = {
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const groupAssignmentWithExperimentConsistencyExperiment = {
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const groupAssignmentWithGroupConsistencyExperimentSwitchBeforeAssignment = {
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const groupAssignmentWithGroupConsistencyExperimentSwitchAfterAssignment = {
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const groupAssignmentWithIndividualConsistencyExperimentSwitchAfterAssignment = {
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const groupAssignmentWithExperimentConsistencyExperimentSwitchAfterAssignment = {
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const firstFactorialExperiment = {
  ...getFirstFactorialExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const secondFactorialExperiment = {
  ...getSecondFactorialExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const withinSubjectExperiment = {
  ...getExperiment(),
  conditions: [
    {
      id: 'c22467b1-f0e9-4444-9517-cc03037bc079',
      name: 'Abstract',
      description: 'Abstract',
      assignmentWeight: 50,
      conditionCode: 'Abstract',
      twoCharacterId: 'AB',
    },
    {
      id: 'd2702d3c-5e04-41a7-8766-1da8a95b72ce',
      name: 'Concrete',
      description: 'Concrete',
      assignmentWeight: 50,
      conditionCode: 'Concrete',
      twoCharacterId: 'CN',
    },
  ],
  assignmentUnit: ASSIGNMENT_UNIT.WITHIN_SUBJECTS,
  conditionOrder: CONDITION_ORDER.RANDOM,
  consistencyRule: null,
};

// exclusion code experiments:
export const individualLevelExclusionExperiment = {
  ...individualAssignmentExperiment,
  partitions : [
    {
      site: 'CurriculumSequence',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'W1',
      excludeIfReached: true,
    },
    {
      site: 'CurriculumSequence',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'W2',
      excludeIfReached: false,
    }
  ]
};

export const groupLevelExclusionExperiment = {
  ...groupAssignmentWithGroupConsistencyExperiment,
  partitions : [
    {
      site: 'CurriculumSequence',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'W1',
      excludeIfReached: true,
    },
    {
      site: 'CurriculumSequence',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'W2',
      excludeIfReached: true,
    },
    {
      site: 'CurriculumSequence',
      description: 'No Decision Point',
      twoCharacterId: 'NP',
      excludeIfReached: true,
    },
  ],
  experimentSegmentInclusion : {
    "segment": {
        "id": "a898b2c5-79c6-4f8b-ab35-2b3b71ba4a11",
        "name": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment",
        "description": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment",
        "context": "home",
        "type": "private",
        "individualForSegment": [],
        "groupForSegment": [
            {
                "groupId": "All",
                "type": "All"
            }
        ],
        "subSegments": []
    }
  },
  experimentSegmentExclusion : {
    "segment": {
        "id": "1b0c0200-7a15-4e19-8688-f9ac283f18aa",
        "name": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment",
        "description": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment",
        "context": "home",
        "type": "private",
        "individualForSegment": [],
        "groupForSegment": [
            {
                "groupId": "2",
                "type": "teacher"
            }
        ],
        "subSegments": []
    }
  }
};

export const ExperimentLevelExclusionExperiment = {
  ...individualAssignmentExperiment,
  experimentSegmentExclusion : {
    "segment": {
        "id": "1b0c0200-7a15-4e19-8688-f9ac283f18aa",
        "name": "be3ae74f-370a-4015-93f3-7761d16f8b17 Exclusion Segment",
        "description": "be3ae74f-370a-4015-93f3-7761d16f8b17 Exclusion Segment",
        "context": "home",
        "type": "private",
        "individualForSegment": [
            {
                "userId": "student1"
            }
        ],
        "groupForSegment": [],
        "subSegments": []
    }
  }
};

export const ExperimentLevelExclusionExperiment2 = {
  ...groupAssignmentWithGroupConsistencyExperiment2,
  experimentSegmentInclusion : {
    "segment": {
        "id": "a898b2c5-79c6-4f8b-ab35-2b3b71ba4a11",
        "name": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment",
        "description": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment",
        "context": "home",
        "type": "private",
        "individualForSegment": [],
        "groupForSegment": [
            {
                "groupId": "All",
                "type": "All"
            }
        ],
        "subSegments": []
    }
  },
  experimentSegmentExclusion : {
    "segment": {
        "id": "1b0c0200-7a15-4e19-8688-f9ac283f18aa",
        "name": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment",
        "description": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment",
        "context": "home",
        "type": "private",
        "individualForSegment": [],
        "groupForSegment": [
            {
                "groupId": "2",
                "type": "teacher"
            }
        ],
        "subSegments": []
    }
  }
};

export const withinSubjectExclusionExperiment = {
  ...withinSubjectExperiment,
  partitions : [
    {
      site: 'CurriculumSequence',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'W1',
      excludeIfReached: true,
    },
    {
      site: 'CurriculumSequence',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'W2',
      excludeIfReached: true,
    },
    {
      site: 'CurriculumSequence',
      description: 'No Decision Point',
      twoCharacterId: 'NP',
      excludeIfReached: true,
    },
  ],
  experimentSegmentInclusion : {
    "segment": {
        "id": "a898b2c5-79c6-4f8b-ab35-2b3b71ba4a11",
        "name": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment",
        "description": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment",
        "context": "home",
        "type": "private",
        "individualForSegment": [],
        "groupForSegment": [
            {
                "groupId": "All",
                "type": "All"
            }
        ],
        "subSegments": []
    }
  },
  experimentSegmentExclusion : {
    "segment": {
        "id": "1b0c0200-7a15-4e19-8688-f9ac283f18aa",
        "name": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment",
        "description": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment",
        "context": "home",
        "type": "private",
        "individualForSegment": [],
        "groupForSegment": [
            {
                "groupId": "2",
                "type": "teacher"
            }
        ],
        "subSegments": []
    }
  }
};

// enrollment code experiments:
export const individualLevelEnrollmentCodeExperiment = {
  ...individualAssignmentExperiment,
  partitions : [
    {
      site: 'CurriculumSequence',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'W1',
      excludeIfReached: true,
    },
    {
      site: 'CurriculumSequence',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'W2',
      excludeIfReached: true,
    },
    {
      site: 'CurriculumSequence',
      description: 'No Decision Point',
      twoCharacterId: 'NP',
      excludeIfReached: true,
    },
  ]
};

export const groupLevelEnrollmentCodeExperiment = {
  ...groupAssignmentWithGroupConsistencyExperiment,
  partitions : [
    {
      site: 'CurriculumSequence',
      target: 'W1',
      description: 'Decision Point on Workspace 1',
      twoCharacterId: 'W1',
      excludeIfReached: true,
    },
    {
      site: 'CurriculumSequence',
      target: 'W2',
      description: 'Decision Point on Workspace 2',
      twoCharacterId: 'W2',
      excludeIfReached: true,
    },
    {
      site: 'CurriculumSequence',
      description: 'No Decision Point',
      twoCharacterId: 'NP',
      excludeIfReached: true,
    },
  ]
};

export const experimentLevelEnrollmentCodeExperiment = {
  ...individualAssignmentExperimentConsistencyRuleExperiment,
};

export const individualExperimentWithMetric = {
  ...individualAssignmentExperiment,
  metrics: [
    {
      key: 'time',
      children: [],
    },
    {
      key: 'w',
      children: [
        {
          key: 'time',
          children: [],
        },
        {
          key: 'completion',
          children: [],
        },
      ],
    },
  ],
};

export const scheduleJobStartExperiment = { ...getExperiment(), state: EXPERIMENT_STATE.SCHEDULED };

export const scheduleJobEndExperiment = {
  ...getExperiment(),
  endOn: new Date().toISOString(),
};

export const scheduleJobUpdateExperiment = scheduleJobEndExperiment;

export const revertToDefault = {
  ...individualAssignmentExperimentConsistencyRuleExperiment,
  revertTo: undefined,
};

export const revertToCondition = {
  ...individualAssignmentExperimentConsistencyRuleRevertToExperiment,
};

export const individualExperimentStats = {
  ...individualAssignmentExperiment,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const groupExperimentStats = {
  ...groupAssignmentWithGroupConsistencyExperiment,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const previewIndividualAssignmentExperiment = {
  ...individualAssignmentExperiment,
  state: EXPERIMENT_STATE.PREVIEW,
};

export const previewGroupExperiment = {
  ...groupAssignmentWithGroupConsistencyExperiment,
  state: EXPERIMENT_STATE.PREVIEW,
};

export const secondExperiment = {
  ...getSecondExperiment(),
};

export const groupAssignmentWithIndividualConsistencyExperimentSecond = {
  ...secondExperiment,
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const groupAndParticipantsExperiment = {
  ...groupAssignmentWithGroupConsistencyExperiment,
  state: EXPERIMENT_STATE.INACTIVE,
  enrollmentCompleteCondition: {
    groupCount: 2,
    userCount: 2,
  },
};

export const participantsOnlyExperiment = {
  ...individualAssignmentExperiment,
  state: EXPERIMENT_STATE.INACTIVE,
  enrollmentCompleteCondition: {
    userCount: 2,
  },
};

export const thirdExperiment = {
  ...getThirdExperiment(),
};

export const groupAssignmentWithIndividualConsistencyExperimentThird = {
  ...thirdExperiment,
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const decimalWeightExperiment = {
  ...getFourthExperiment(),
};

export const payloadConditionExperiment = {
  ...getFifthExperiment(),
};

export const competingExperimentAssignmentExperiment1 = {
  ...getSecondExperiment(),
};

export const competingExperimentAssignmentExperiment2 = {
  ...getThirdExperiment(),
  state: EXPERIMENT_STATE.ENROLLING,
};

export const competingExperimentAssignmentExperiment3 = {
  ...getSixthExperiment(),
  state: EXPERIMENT_STATE.ENROLLING,
};

export const stratificationSRSExperimentAssignmentExperiment1 = {
  ...getExperiment(),
  conditions: [
    {
      id: 'c22467b1-f0e9-4444-9517-cc03037bc079',
      name: 'Abstract',
      description: 'Abstract',
      assignmentWeight: 50,
      conditionCode: 'Abstract',
      twoCharacterId: 'AB',
    },
    {
      id: 'd2702d3c-5e04-41a7-8766-1da8a95b72ce',
      name: 'Concrete',
      description: 'Concrete',
      assignmentWeight: 50,
      conditionCode: 'Concrete',
      twoCharacterId: 'CN',
    },
  ],
  conditionOrder: CONDITION_ORDER.RANDOM,
  consistencyRule: null,
  assignmentAlgorithm: 'stratified random sampling'
};

export const stratificationRandomExperimentAssignmentExperiment2 = {
  ...getExperiment(),
  conditions: [
    {
      id: 'c22467b1-f0e9-4444-9517-cc03037bc079',
      name: 'Abstract',
      description: 'Abstract',
      assignmentWeight: 50,
      conditionCode: 'Abstract',
      twoCharacterId: 'AB',
    },
    {
      id: 'd2702d3c-5e04-41a7-8766-1da8a95b72ce',
      name: 'Concrete',
      description: 'Concrete',
      assignmentWeight: 50,
      conditionCode: 'Concrete',
      twoCharacterId: 'CN',
    },
  ],
  conditionOrder: CONDITION_ORDER.RANDOM,
  consistencyRule: null
};
