import { createAction, props } from '@ngrx/store';
import {
  FeatureFlag_LEGACY,
  UpsertFeatureFlagType_LEGACY,
  FLAG_SEARCH_SORT_KEY_LEGACY,
  SORT_AS_LEGACY,
} from './feature-flags.model._LEGACY';

export const actionFetchFeatureFlags_LEGACY = createAction(
  '[Feature Flags] Fetch Feature Flags',
  props<{ fromStarting?: boolean }>()
);

export const actionFetchFeatureFlagsSuccess_LEGACY = createAction(
  '[Feature Flags] Fetch Feature Flags Success',
  props<{ flags: FeatureFlag_LEGACY[]; totalFlags: number }>()
);

export const actionFetchFeatureFlagsFailure_LEGACY = createAction('[Feature Flags] Fetch Feature Flags Failure');

export const actionUpsertFeatureFlag_LEGACY = createAction(
  '[Feature Flags] Upsert Feature Flag',
  props<{ flag: FeatureFlag_LEGACY; actionType: UpsertFeatureFlagType_LEGACY }>()
);

export const actionUpsertFeatureFlagSuccess_LEGACY = createAction(
  '[Feature Flags] Upsert Feature Flag Success',
  props<{ flag: FeatureFlag_LEGACY }>()
);

export const actionUpsertFeatureFlagFailure_LEGACY = createAction('[Feature Flags] Upsert Feature Flag Failure');

export const actionUpdateFlagStatus_LEGACY = createAction(
  '[Feature Flags] Update Flag Status',
  props<{ flagId: string; status: boolean }>()
);

export const actionUpdateFlagStatusSuccess_LEGACY = createAction(
  '[Feature Flags] Update Flag Status Success',
  props<{ flag: FeatureFlag_LEGACY }>()
);

export const actionUpdateFlagStatusFailure_LEGACY = createAction('[Feature Flags] Update Flag Status Failure');

export const actionDeleteFeatureFlag_LEGACY = createAction(
  '[Feature Flags] Delete Feature Flag',
  props<{ flagId: string }>()
);

export const actionDeleteFeatureFlagSuccess_LEGACY = createAction(
  '[Feature Flags] Delete Feature Flag Success',
  props<{ flag: FeatureFlag_LEGACY }>()
);

export const actionDeleteFeatureFlagFailure_LEGACY = createAction('[Feature Flags] Delete Feature Flag Failure');

export const actionSetIsLoadingFeatureFlags_LEGACY = createAction(
  '[Feature Flags] Set Is Loading Flags',
  props<{ isLoadingFeatureFlags: boolean }>()
);

export const actionSetSkipFlags_LEGACY = createAction('[Feature Flags] Set Skip Flags', props<{ skipFlags: number }>());

export const actionSetSearchKey_LEGACY = createAction(
  '[Feature Flags] Set Search key value',
  props<{ searchKey: FLAG_SEARCH_SORT_KEY_LEGACY }>()
);

export const actionSetSearchString_LEGACY = createAction(
  '[Feature Flags] Set Search String',
  props<{ searchString: string }>()
);

export const actionSetSortKey_LEGACY = createAction(
  '[Feature Flags] Set Sort key value',
  props<{ sortKey: FLAG_SEARCH_SORT_KEY_LEGACY }>()
);

export const actionSetSortingType_LEGACY = createAction(
  '[Feature Flags] Set Sorting type',
  props<{ sortingType: SORT_AS_LEGACY }>()
);
