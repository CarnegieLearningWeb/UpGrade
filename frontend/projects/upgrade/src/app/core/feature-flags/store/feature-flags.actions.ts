import { createAction, props } from '@ngrx/store';
import {
  FeatureFlag,
  UpdateFeatureFlagStatusRequest,
  AddFeatureFlagRequest,
  UpdateFeatureFlagRequest,
} from './feature-flags.model';
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

export const actionFetchFeatureFlagById = createAction(
  '[Feature Flags] Fetch Feature Flags By Id',
  props<{ featureFlagId: string }>()
);

export const actionFetchFeatureFlagByIdSuccess = createAction(
  '[Feature Flags] Fetch Feature Flags By Id Success',
  props<{ flag: FeatureFlag }>()
);

export const actionFetchFeatureFlagByIdFailure = createAction('[Feature Flags] Fetch Feature Flags By Id Failure');
export const actionAddFeatureFlag = createAction(
  '[Feature Flags] Add Feature Flag',
  props<{ addFeatureFlagRequest: AddFeatureFlagRequest }>()
);

export const actionAddFeatureFlagSuccess = createAction(
  '[Feature Flags] Add Feature Flag Success',
  props<{ response: FeatureFlag }>()
);

export const actionAddFeatureFlagFailure = createAction('[Feature Flags] Add Feature Flag Failure');

export const actionDeleteFeatureFlag = createAction('[Feature Flags] Delete Feature Flag', props<{ flagId: string }>());

export const actionDeleteFeatureFlagSuccess = createAction(
  '[Feature Flags] Delete Feature Flag Success',
  props<{ flag: FeatureFlag }>()
);

export const actionDeleteFeatureFlagFailure = createAction('[Feature Flags] Delete Feature Flag Failure');

export const actionUpdateFeatureFlag = createAction(
  '[Feature Flags] Update Feature Flag',
  props<{ flag: UpdateFeatureFlagRequest }>()
);

export const actionUpdateFeatureFlagSuccess = createAction(
  '[Feature Flags] Update Feature Flag Success',
  props<{ response: FeatureFlag }>()
);

export const actionUpdateFeatureFlagFailure = createAction('[Feature Flags] Update Feature Flag Failure');

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

export const actionSetActiveDetailsTabIndex = createAction(
  '[Feature Flags] Set Active Details Tab Index',
  props<{ activeDetailsTabIndex: number }>()
);

export const actionUpdateFeatureFlagStatus = createAction(
  '[Feature Flags] Update Feature Flag Status',
  props<{ updateFeatureFlagStatusRequest: UpdateFeatureFlagStatusRequest }>()
);

export const actionUpdateFeatureFlagStatusSuccess = createAction(
  '[Feature Flags] Update Feature Flag Status Success',
  props<{ response: FeatureFlag }>()
);

export const actionUpdateFeatureFlagStatusFailure = createAction('[Feature Flags] Update Feature Flag Status Failure');
