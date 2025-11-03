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
  EXPERIMENT_TYPE,
  ASSIGNMENT_ALGORITHM,
} from 'upgrade_types';

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export const individualAssignmentExperiment = clone({
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const individualAssignmentGroupConsistencyExperiment = clone({
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const individualAssignmentExperimentConsistencyRuleRevertToExperiment = clone({
  ...getRevertToExperiment(),
});

export const individualAssignmentExperimentConsistencyRuleExperiment = clone({
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.ASSIGN,
  revertTo: getExperiment().conditions[0].id,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const groupAssignmentWithGroupConsistencyExperiment = clone({
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const groupAssignmentWithGroupConsistencyExperiment2 = clone({
  ...getSecondExperiment(),
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const groupAssignmentWithIndividualConsistencyExperiment = clone({
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const groupAssignmentWithExperimentConsistencyExperiment = clone({
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const groupAssignmentWithGroupConsistencyExperimentSwitchBeforeAssignment = clone({
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const groupAssignmentWithGroupConsistencyExperimentSwitchAfterAssignment = clone({
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.GROUP,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const groupAssignmentWithIndividualConsistencyExperimentSwitchAfterAssignment = clone({
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const groupAssignmentWithExperimentConsistencyExperimentSwitchAfterAssignment = clone({
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const firstFactorialExperiment = clone({
  ...getFirstFactorialExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.FACTORIAL,
});

export const secondFactorialExperiment = clone({
  ...getSecondFactorialExperiment(),
  consistencyRule: CONSISTENCY_RULE.EXPERIMENT,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
  logging: false,
  type: EXPERIMENT_TYPE.FACTORIAL,
});

export const withinSubjectExperiment = clone({
  ...getExperiment(),
  conditions: [
    {
      id: 'c22467b1-f0e9-4444-9517-cc03037bc079',
      name: 'Abstract',
      description: 'Abstract',
      assignmentWeight: 50,
      conditionCode: 'Abstract',
      twoCharacterId: 'AB',
      order: 1,
    },
    {
      id: 'd2702d3c-5e04-41a7-8766-1da8a95b72ce',
      name: 'Concrete',
      description: 'Concrete',
      assignmentWeight: 50,
      conditionCode: 'Concrete',
      twoCharacterId: 'CN',
      order: 2,
    },
  ],
  assignmentUnit: ASSIGNMENT_UNIT.WITHIN_SUBJECTS,
  conditionOrder: CONDITION_ORDER.RANDOM,
  consistencyRule: null,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

// exclusion code experiments:
export const individualLevelExclusionExperiment = clone({
  ...individualAssignmentExperiment,
  partitions: [
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
    },
  ],
});

export const groupLevelExclusionExperiment = clone({
  ...groupAssignmentWithGroupConsistencyExperiment,
  partitions: [
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
  experimentSegmentInclusion: {
    segment: {
      id: 'a898b2c5-79c6-4f8b-ab35-2b3b71ba4a11',
      name: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment',
      description: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment',
      context: 'home',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [
        {
          groupId: 'All',
          type: 'All',
        },
      ],
      subSegments: [],
    },
  },
  experimentSegmentExclusion: {
    segment: {
      id: '1b0c0200-7a15-4e19-8688-f9ac283f18aa',
      name: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment',
      description: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment',
      context: 'home',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [
        {
          groupId: '2',
          type: 'teacher',
        },
      ],
      subSegments: [],
    },
  },
});

export const ExperimentLevelExclusionExperiment = clone({
  ...individualAssignmentExperiment,
  experimentSegmentExclusion: {
    segment: {
      id: '1b0c0200-7a15-4e19-8688-f9ac283f18aa',
      name: 'be3ae74f-370a-4015-93f3-7761d16f8b17 Exclusion Segment',
      description: 'be3ae74f-370a-4015-93f3-7761d16f8b17 Exclusion Segment',
      context: 'home',
      type: 'private',
      individualForSegment: [
        {
          userId: 'student1',
        },
      ],
      groupForSegment: [],
      subSegments: [],
    },
  },
});

export const ExperimentLevelExclusionExperiment2 = clone({
  ...groupAssignmentWithGroupConsistencyExperiment2,
  experimentSegmentInclusion: {
    segment: {
      id: 'a898b2c5-79c6-4f8b-ab35-2b3b71ba4a11',
      name: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment',
      description: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment',
      context: 'home',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [
        {
          groupId: 'All',
          type: 'All',
        },
      ],
      subSegments: [],
    },
  },
  experimentSegmentExclusion: {
    segment: {
      id: '1b0c0200-7a15-4e19-8688-f9ac283f18aa',
      name: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment',
      description: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment',
      context: 'home',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [
        {
          groupId: '2',
          type: 'teacher',
        },
      ],
      subSegments: [],
    },
  },
});

export const withinSubjectExclusionExperiment = clone({
  ...withinSubjectExperiment,
  partitions: [
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
  experimentSegmentInclusion: {
    segment: {
      id: 'a898b2c5-79c6-4f8b-ab35-2b3b71ba4a11',
      name: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment',
      description: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Inclusion Segment',
      context: 'home',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [
        {
          groupId: 'All',
          type: 'All',
        },
      ],
      subSegments: [],
    },
  },
  experimentSegmentExclusion: {
    segment: {
      id: '1b0c0200-7a15-4e19-8688-f9ac283f18aa',
      name: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment',
      description: '8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment',
      context: 'home',
      type: 'private',
      individualForSegment: [],
      groupForSegment: [
        {
          groupId: '2',
          type: 'teacher',
        },
      ],
      subSegments: [],
    },
  },
});

// enrollment code experiments:
export const individualLevelEnrollmentCodeExperiment = clone({
  ...individualAssignmentExperiment,
  partitions: [
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
});

export const groupLevelEnrollmentCodeExperiment = clone({
  ...groupAssignmentWithGroupConsistencyExperiment,
  partitions: [
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
});

export const experimentLevelEnrollmentCodeExperiment = clone({
  ...individualAssignmentExperimentConsistencyRuleExperiment,
});

export const individualExperimentWithMetric = clone({
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
});

export const scheduleJobStartExperiment = clone({ ...getExperiment(), state: EXPERIMENT_STATE.SCHEDULED });

export const scheduleJobEndExperiment = clone({
  ...getExperiment(),
  endOn: new Date().toISOString(),
});

export const scheduleJobUpdateExperiment = scheduleJobEndExperiment;

export const revertToDefault = clone({
  ...individualAssignmentExperimentConsistencyRuleExperiment,
  revertTo: undefined,
});

export const revertToCondition = individualAssignmentExperimentConsistencyRuleRevertToExperiment;

export const individualExperimentStats = individualAssignmentExperiment;

export const groupExperimentStats = groupAssignmentWithGroupConsistencyExperiment;

export const previewIndividualAssignmentExperiment = clone({
  ...individualAssignmentExperiment,
  state: EXPERIMENT_STATE.PREVIEW,
});

export const previewGroupExperiment = clone({
  ...groupAssignmentWithGroupConsistencyExperiment,
  state: EXPERIMENT_STATE.PREVIEW,
});

export const secondExperiment = clone({
  ...getSecondExperiment(),
});

export const groupAssignmentWithIndividualConsistencyExperimentSecond = clone({
  ...secondExperiment,
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
});

export const groupAndParticipantsExperiment = clone({
  ...groupAssignmentWithGroupConsistencyExperiment,
  state: EXPERIMENT_STATE.INACTIVE,
  enrollmentCompleteCondition: {
    groupCount: 2,
    userCount: 2,
  },
});

export const participantsOnlyExperiment = clone({
  ...individualAssignmentExperiment,
  state: EXPERIMENT_STATE.INACTIVE,
  enrollmentCompleteCondition: {
    userCount: 2,
  },
});

export const thirdExperiment = clone({
  ...getThirdExperiment(),
});

export const groupAssignmentWithIndividualConsistencyExperimentThird = clone({
  ...thirdExperiment,
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.GROUP,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
});

export const decimalWeightExperiment = clone({
  ...getFourthExperiment(),
});

export const payloadConditionExperiment = clone({
  ...getFifthExperiment(),
});

export const competingExperimentAssignmentExperiment1 = clone({
  ...getSecondExperiment(),
});

export const competingExperimentAssignmentExperiment2 = clone({
  ...getThirdExperiment(),
  state: EXPERIMENT_STATE.ENROLLING,
});

export const competingExperimentAssignmentExperiment3 = clone({
  ...getSixthExperiment(),
  state: EXPERIMENT_STATE.ENROLLING,
});

export const stratificationSRSExperimentAssignmentExperiment1 = clone({
  ...getExperiment(),
  conditions: [
    {
      id: 'c22467b1-f0e9-4444-9517-cc03037bc079',
      name: 'Abstract',
      description: 'Abstract',
      assignmentWeight: 50,
      conditionCode: 'Abstract',
      twoCharacterId: 'AB',
      order: 1,
    },
    {
      id: 'd2702d3c-5e04-41a7-8766-1da8a95b72ce',
      name: 'Concrete',
      description: 'Concrete',
      assignmentWeight: 50,
      conditionCode: 'Concrete',
      twoCharacterId: 'CN',
      order: 2,
    },
  ],
  conditionOrder: CONDITION_ORDER.RANDOM,
  consistencyRule: null,
  assignmentAlgorithm: ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});

export const stratificationRandomExperimentAssignmentExperiment2 = clone({
  ...getExperiment(),
  conditions: [
    {
      id: 'c22467b1-f0e9-4444-9517-cc03037bc079',
      name: 'Abstract',
      description: 'Abstract',
      assignmentWeight: 50,
      conditionCode: 'Abstract',
      twoCharacterId: 'AB',
      order: 1,
    },
    {
      id: 'd2702d3c-5e04-41a7-8766-1da8a95b72ce',
      name: 'Concrete',
      description: 'Concrete',
      assignmentWeight: 50,
      conditionCode: 'Concrete',
      twoCharacterId: 'CN',
      order: 2,
    },
  ],
  conditionOrder: CONDITION_ORDER.RANDOM,
  consistencyRule: null,
  logging: false,
  type: EXPERIMENT_TYPE.SIMPLE,
});
