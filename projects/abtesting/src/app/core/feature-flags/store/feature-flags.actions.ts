import { createAction, props } from '@ngrx/store';
import { FeatureFlag, UpsertFeatureFlagType } from './feature-flags.model';

export const actionFetchAllFeatureFlags = createAction(
  '[Feature Flags] Fetch All Feature Flags'
);

export const actionFetchAllFeatureFlagsSuccess = createAction(
  '[Feature Flags] Fetch All Feature Flags Success',
  props<{ flags: FeatureFlag[] }>()
);

export const actionFetchAllFeatureFlagsFailure = createAction(
  '[Feature Flags] Fetch All Feature Flags Failure'
);

export const actionUpsertFeatureFlag = createAction(
  '[Feature Flags] Upsert Feature Flag',
  props<{ flag: FeatureFlag, actionType: UpsertFeatureFlagType }>()
);

export const actionUpsertFeatureFlagSuccess = createAction(
  '[Feature Flags] Upsert Feature Flag Success',
  props<{ flag: FeatureFlag }>()
);

export const actionUpsertFeatureFlagFailure = createAction(
  '[Feature Flags] Upsert Feature Flag Failure',
);

export const actionUpdateFlagStatus = createAction(
  '[Feature Flags] Update Flag Status',
  props<{ flagId: string, status: boolean }>()
);

export const actionUpdateFlagStatusSuccess = createAction(
  '[Feature Flags] Update Flag Status Success',
  props<{ flag: FeatureFlag }>()
);

export const actionUpdateFlagStatusFailure = createAction(
  '[Feature Flags] Update Flag Status Failure',
);

export const actionDeleteFeatureFlag = createAction(
  '[Feature Flags] Delete Feature Flag',
  props<{ flagId: string }>()
);

export const actionDeleteFeatureFlagSuccess = createAction(
  '[Feature Flags] Delete Feature Flag Success',
  props<{ flag: FeatureFlag }>()
);

export const actionDeleteFeatureFlagFailure = createAction(
  '[Feature Flags] Delete Feature Flag Failure',
);
