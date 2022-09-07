import { getExperiment, getRevertToExperiment, getSecondExperiment, getThirdExperiment, getFourthExperiment} from './raw';
import { CONSISTENCY_RULE, ASSIGNMENT_UNIT, POST_EXPERIMENT_RULE, EXPERIMENT_STATE } from 'upgrade_types';

export const individualAssignmentExperiment = {
  ...getExperiment(),
  consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
  assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
  postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
  state: EXPERIMENT_STATE.INACTIVE,
};

export const individualAssignmentExperimentConsistencyRuleRevertToExperiment = {
  ...getRevertToExperiment()
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

export const groupAssignmentWithIndividulaConsistencyExperiment = {
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
}

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
}

export const decimalWeightExperiment = {
  ...getFourthExperiment(),
}
