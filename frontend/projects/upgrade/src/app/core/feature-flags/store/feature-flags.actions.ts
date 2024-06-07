import { createAction, props } from '@ngrx/store';
import { AddFeatureFlagRequest, FeatureFlag, UpdateFeatureFlagStatusRequest } from './feature-flags.model';
import { FLAG_SEARCH_KEY, FLAG_SORT_KEY, SORT_AS_DIRECTION } from 'upgrade_types';

export const actionFetchFeatureFlags = createAction(
  '[Feature Flags] Fetch Feature Flags Paginated',
  props<{ fromStarting?: boolean }>()
);

export const actionFetchFeatureFlagsSuccess = createAction(
  '[Feature Flags] Fetch Feature Flags Paginated Success',
  props<{ flags: FeatureFlag[]; totalFlags: number }>()
);

export const actionFetchFeatureFlagsFailure = createAction('[Feature Flags] Fetch Feature Flags Paginated Failure');

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

export const actionAddFeatureFlag = createAction(
  '[Feature Flags] Add Feature Flag',
  props<{ addFeatureFlagRequest: AddFeatureFlagRequest }>()
);

export const actionAddFeatureFlagSuccess = createAction(
  '[Feature Flags] Add Feature Flag Success',
  props<{ response: FeatureFlag }>()
);

export const actionAddFeatureFlagFailure = createAction('[Feature Flags] Add Feature Flag Failure');

export const actionSetActiveDetailsTabIndex = createAction(
  '[Feature Flags] Set Active Details Tab Index',
  props<{ activeDetailsTabIndex: number }>()
);

export const actionEnableFeatureFlag = createAction(
  '[Feature Flags] Enable Feature Flag',
  props<{ updateFeatureFlagStatusRequest: UpdateFeatureFlagStatusRequest }>()
);

export const actionEnableFeatureFlagSuccess = createAction(
  '[Feature Flags] Enable Feature Flag Success',
  props<{ response: FeatureFlag }>()
);

export const actionEnableFeatureFlagFailure = createAction('[Feature Flags] Enable Feature Flag Failure');

export const actionDisableFeatureFlag = createAction(
  '[Feature Flags] Disable Feature Flag',
  props<{ updateFeatureFlagStatusRequest: UpdateFeatureFlagStatusRequest }>()
);

export const actionDisableFeatureFlagSuccess = createAction(
  '[Feature Flags] Disable Feature Flag Success',
  props<{ response: FeatureFlag }>()
);

export const actionDisableFeatureFlagFailure = createAction('[Feature Flags] Disable Feature Flag Failure');
