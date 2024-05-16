import { createAction, props } from '@ngrx/store';
import { FeatureFlag, UpsertFeatureFlagType } from './feature-flags.model';
import { FEATURE_FLAG_STATUS, FLAG_SEARCH_KEY, FLAG_SORT_KEY, SORT_AS_DIRECTION } from 'upgrade_types';

export const actionAllFetchFeatureFlags = createAction(
  '[Feature Flags] Fetch All Feature Flags',
  props<{ fromStarting?: boolean }>()
);

export const actionAllFetchFeatureFlagsSuccess = createAction(
  '[Feature Flags] Fetch All Feature Flags Success',
  props<{ flags: FeatureFlag[]; totalFlags: number }>()
);

export const actionAllFetchFeatureFlagsFailure = createAction('[Feature Flags] Fetch All Feature Flags Failure');

export const actionFetchFeatureFlagById = createAction(
  '[Feature Flags] Fetch Feature Flags By Id',
  props<{ fromStarting?: boolean }>()
);

export const actionFetchFeatureFlagByIdSuccess = createAction(
  '[Feature Flags] Fetch Feature Flags By Id Success',
  props<{ flags: FeatureFlag[]; totalFlags: number }>()
);

export const actionFetchFeatureFlagByIdFailure = createAction('[Feature Flags] Fetch Feature Flags By Id Failure');

export const actionFetchFeatureFlags = createAction(
  '[Feature Flags] Fetch Feature Flags Paginated',
  props<{ fromStarting?: boolean }>()
);

export const actionFetchFeatureFlagsSuccess = createAction(
  '[Feature Flags] Fetch Feature Flags Paginated Success',
  props<{ flags: FeatureFlag[]; totalFlags: number }>()
);

export const actionFetchFeatureFlagsFailure = createAction('[Feature Flags] Fetch Feature Flags Paginated Failure');

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
  props<{ flagId: string; status: FEATURE_FLAG_STATUS }>()
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
  props<{ searchKey: FLAG_SEARCH_KEY }>()
);

export const actionSetSearchString = createAction(
  '[Feature Flags] Set Search String',
  props<{ searchString: string }>()
);

export const actionSetSortKey = createAction('[Feature Flags] Set Sort key value', props<{ sortKey: FLAG_SORT_KEY }>());

export const actionSetSortingType = createAction(
  '[Feature Flags] Set Sorting type',
  props<{ sortingType: SORT_AS_DIRECTION }>()
);
