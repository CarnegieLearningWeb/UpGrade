import { createAction, props } from '@ngrx/store';
import {
  FeatureFlag,
  UpdateFeatureFlagStatusRequest,
  AddFeatureFlagRequest,
  UpdateFeatureFlagRequest,
  FeatureFlagSegmentListDetails,
} from './feature-flags.model';
import { FLAG_SEARCH_KEY, FLAG_SORT_KEY, SORT_AS_DIRECTION } from 'upgrade_types';
import { AddPrivateSegmentListRequest, EditPrivateSegmentListRequest } from '../../segments/store/segments.model';

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

export const actionSetIsLoadingImportFeatureFlag = createAction(
  '[Feature Flags] Set Is Loading for Flag Import',
  props<{ isLoadingImportFeatureFlag: boolean }>()
);


export const actionEmailFeatureFlagData = createAction(
  '[Feature Flags] Email Feature Flag Data',
  props<{ featureFlagId: string }>()
);

export const actionEmailFeatureFlagDataSuccess = createAction('[Feature Flags] Email Feature Flag Data Success');

export const actionEmailFeatureFlagDataFailure = createAction('[Feature Flags] Email Feature Flag Data Failure');

export const actionExportFeatureFlagDesign = createAction(
  '[Feature Flags] Export Feature Flag Design',
  props<{ featureFlagId: string }>()
);

export const actionExportFeatureFlagDesignSuccess = createAction('[Feature Flags] Export Feature Flag Design Success');

export const actionExportFeatureFlagDesignFailure = createAction('[Feature Flags] Export Feature Flag Design Failure');

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

export const actionAddFeatureFlagInclusionList = createAction(
  '[Feature Flags] Add Feature Flag Inclusion List',
  props<{ list: AddPrivateSegmentListRequest }>()
);

export const actionAddFeatureFlagInclusionListSuccess = createAction(
  '[Feature Flags] Add Feature Flag Inclusion List Success',
  props<{ listResponse: FeatureFlagSegmentListDetails }>()
);

export const actionAddFeatureFlagInclusionListFailure = createAction(
  '[Feature Flags] Add Feature Flag Inclusion List Failure',
  props<{ error: any }>()
);

export const actionUpdateFeatureFlagInclusionList = createAction(
  '[Feature Flags] Update Feature Flag Inclusion List',
  props<{ list: EditPrivateSegmentListRequest }>()
);

export const actionUpdateFeatureFlagInclusionListSuccess = createAction(
  '[Feature Flags] Update Feature Flag Inclusion List Success',
  props<{ listResponse: FeatureFlagSegmentListDetails }>()
);

export const actionUpdateFeatureFlagInclusionListFailure = createAction(
  '[Feature Flags] Update Feature Flag Inclusion List Failure',
  props<{ error: any }>()
);

export const actionDeleteFeatureFlagInclusionList = createAction(
  '[Feature Flags] Delete Feature Flag Inclusion List',
  props<{ segmentId: string }>()
);

export const actionDeleteFeatureFlagInclusionListSuccess = createAction(
  '[Feature Flags] Delete Feature Flag Inclusion List Success',
  props<{ segmentId: string }>()
);

export const actionDeleteFeatureFlagInclusionListFailure = createAction(
  '[Feature Flags] Delete Feature Flag Inclusion List Failure',
  props<{ error: any }>()
);
