import { createAction, props } from '@ngrx/store';
import { FeatureFlag, UpsertFeatureFlagType, FLAG_SEARCH_SORT_KEY, SORT_AS } from './feature-flags.model';

export const actionFetchFeatureFlags = createAction(
  '[Feature Flags] Fetch Feature Flags',
  props<{ fromStarting?: boolean }>()
);

export const actionFetchFeatureFlagsSuccess = createAction(
  '[Feature Flags] Fetch Feature Flags Success',
  props<{ flags: FeatureFlag[]; totalFlags: number }>()
);

export const actionFetchFeatureFlagsFailure = createAction('[Feature Flags] Fetch Feature Flags Failure');

export const actionUpsertFeatureFlag = createAction(
  '[Feature Flags] Upsert Feature Flag',
  props<{ flag: FeatureFlag; actionType: UpsertFeatureFlagType }>()
);

export const actionUpsertFeatureFlagSuccess = createAction(
  '[Feature Flags] Upsert Feature Flag Success',
  props<{ flag: FeatureFlag }>()
);

export const actionUpsertFeatureFlagFailure = createAction('[Feature Flags] Upsert Feature Flag Failure');

export const actionUpdateFlagStatus = createAction(
  '[Feature Flags] Update Flag Status',
  props<{ flagId: string; status: boolean }>()
);

export const actionUpdateFlagStatusSuccess = createAction(
  '[Feature Flags] Update Flag Status Success',
  props<{ flag: FeatureFlag }>()
);

export const actionUpdateFlagStatusFailure = createAction('[Feature Flags] Update Flag Status Failure');

export const actionDeleteFeatureFlag = createAction('[Feature Flags] Delete Feature Flag', props<{ flagId: string }>());

export const actionDeleteFeatureFlagSuccess = createAction(
  '[Feature Flags] Delete Feature Flag Success',
  props<{ flag: FeatureFlag }>()
);

export const actionDeleteFeatureFlagFailure = createAction('[Feature Flags] Delete Feature Flag Failure');

export const actionSetIsLoadingFeatureFlags = createAction(
  '[Feature Flags] Set Is Loading Flags',
  props<{ isLoadingFeatureFlags: boolean }>()
);

export const actionSetSkipFlags = createAction('[Feature Flags] Set Skip Flags', props<{ skipFlags: number }>());

export const actionSetSearchKey = createAction(
  '[Feature Flags] Set Search key value',
  props<{ searchKey: FLAG_SEARCH_SORT_KEY }>()
);

export const actionSetSearchString = createAction(
  '[Feature Flags] Set Search String',
  props<{ searchString: string }>()
);

export const actionSetSortKey = createAction(
  '[Feature Flags] Set Sort key value',
  props<{ sortKey: FLAG_SEARCH_SORT_KEY }>()
);

export const actionSetSortingType = createAction('[Feature Flags] Set Sorting type', props<{ sortingType: SORT_AS }>());
