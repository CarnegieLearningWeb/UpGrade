import * as auth from '../auth/store/auth.actions';
import * as experiments from '../experiments/store/experiments.actions';

import * as flags from '../feature-flags/store/feature-flags.actions';

import * as segments from '../segments/store/segments.actions';

// These writes can change a selected name, state, or segment usage through an owner/list.
export const batchInvalidationTypes: string[] = [
  experiments.batchActions.batchDeleteCompleted.type,
  flags.batchActions.batchDeleteCompleted.type,
  segments.batchActions.batchDeleteCompleted.type,
  auth.actionSetUserInfo.type,
  auth.actionSetUserInfoSuccess.type,
  auth.actionLoginSuccess.type,
  experiments.actionUpsertExperimentSuccess.type,
  experiments.actionDeleteExperimentSuccess.type,
  experiments.actionUpdateExperimentStateSuccess.type,
  experiments.actionUpdateExperimentFilterModeSuccess.type,
  experiments.actionImportExperimentSuccess.type,
  experiments.actionAddExperimentInclusionListSuccess.type,
  experiments.actionUpdateExperimentInclusionListSuccess.type,
  experiments.actionDeleteExperimentInclusionListSuccess.type,
  experiments.actionAddExperimentExclusionListSuccess.type,
  experiments.actionUpdateExperimentExclusionListSuccess.type,
  experiments.actionDeleteExperimentExclusionListSuccess.type,
  flags.actionAddFeatureFlagSuccess.type,
  flags.actionDeleteFeatureFlagSuccess.type,
  flags.actionUpdateFeatureFlagSuccess.type,
  flags.actionUpdateFeatureFlagStatusSuccess.type,
  flags.actionUpdateFilterModeSuccess.type,
  flags.actionAddFeatureFlagInclusionListSuccess.type,
  flags.actionUpdateFeatureFlagInclusionListSuccess.type,
  flags.actionUpdateFeatureFlagInclusionListStatusSuccess.type,
  flags.actionDeleteFeatureFlagInclusionListSuccess.type,
  flags.actionAddFeatureFlagExclusionListSuccess.type,
  flags.actionUpdateFeatureFlagExclusionListSuccess.type,
  flags.actionUpdateFeatureFlagExclusionListStatusSuccess.type,
  flags.actionDeleteFeatureFlagExclusionListSuccess.type,
  segments.actionUpsertSegmentSuccess.type,
  segments.actionAddSegmentSuccess.type,
  segments.actionUpdateSegmentSuccess.type,
  segments.actionDeleteSegmentSuccess.type,
  segments.actionAddSegmentListSuccess.type,
  segments.actionUpdateSegmentListSuccess.type,
  segments.actionDeleteSegmentListSuccess.type,
];
