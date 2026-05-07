import { createReducer, Action, on } from '@ngrx/store';
import { FeatureFlagState, FeatureFlag } from './feature-flags.model';
import * as FeatureFlagsActions from './feature-flags.actions';
import { FLAG_SEARCH_KEY, FLAG_SORT_KEY, SORT_AS_DIRECTION } from 'upgrade_types';

export const initialState: FeatureFlagState = {
  // List page state
  featureFlags: [],
  isLoadingFeatureFlags: false,
  hasInitialFeatureFlagsDataLoaded: false,
  skipFlags: 0,
  totalFlags: null,
  searchKey: FLAG_SEARCH_KEY.ALL,
  searchValue: null,
  sortKey: FLAG_SORT_KEY.NAME,
  sortAs: SORT_AS_DIRECTION.ASCENDING,

  // Details page state
  selectedFlag: null,
  isLoadingSelectedFeatureFlag: false,
  isLoadingUpsertFeatureFlag: false,
  isLoadingImportFeatureFlag: false,
  isLoadingUpdateFeatureFlagStatus: false,
  isLoadingFeatureFlagDelete: false,
  isLoadingUpsertPrivateSegmentList: false,
  duplicateKeyFound: false,

  // Graph state
  graphInfo: null,
  isGraphLoading: false,
  totalExposures: null,
};

const reducer = createReducer(
  initialState,
  on(FeatureFlagsActions.actionFetchFeatureFlagsSuccess, (state, { flags, totalFlags }) => {
    // Replace entire array with backend data - preserves exact sort order
    const featureFlags =
      state.skipFlags === 0
        ? flags // First fetch - use backend data directly
        : [...state.featureFlags, ...flags]; // Pagination - append to existing

    return {
      ...state,
      featureFlags,
      totalFlags,
      skipFlags: state.skipFlags + flags.length,
      isLoadingFeatureFlags: false,
      hasInitialFeatureFlagsDataLoaded: true,
    };
  }),
  on(FeatureFlagsActions.actionFetchFeatureFlagsFailure, (state) => ({ ...state, isLoadingFeatureFlags: false })),

  // Feature Flag Detail Actions
  on(FeatureFlagsActions.actionFetchFeatureFlagById, (state) => ({
    ...state,
    isLoadingSelectedFeatureFlag: true,
  })),
  on(FeatureFlagsActions.actionFetchFeatureFlagByIdSuccess, (state, { flag }) => ({
    ...state,
    selectedFlag: flag,
    isLoadingSelectedFeatureFlag: false,
  })),
  on(FeatureFlagsActions.actionFetchFeatureFlagByIdFailure, (state) => ({
    ...state,
    isLoadingSelectedFeatureFlag: false,
  })),

  // Feature Flag Upsert Actions (Add/Update both = upsert result)
  on(FeatureFlagsActions.actionAddFeatureFlag, FeatureFlagsActions.actionUpdateFeatureFlag, (state) => ({
    ...state,
    isLoadingUpsertFeatureFlag: true,
  })),
  on(
    FeatureFlagsActions.actionUpdateFeatureFlagSuccess,
    FeatureFlagsActions.actionAddFeatureFlagSuccess,
    (state, { response }) => ({
      ...state,
      selectedFlag: response,
      isLoadingUpsertFeatureFlag: false,
    })
  ),
  on(FeatureFlagsActions.actionAddFeatureFlagFailure, FeatureFlagsActions.actionUpdateFeatureFlagFailure, (state) => ({
    ...state,
    isLoadingUpsertFeatureFlag: false,
  })),
  on(FeatureFlagsActions.actionSetIsDuplicateKey, (state, { duplicateKeyFound }) => ({
    ...state,
    duplicateKeyFound,
    isLoadingUpsertFeatureFlag: false,
  })),

  // Feature Flag Delete Actions
  on(FeatureFlagsActions.actionDeleteFeatureFlag, (state) => ({ ...state, isLoadingFeatureFlagDelete: true })),
  on(FeatureFlagsActions.actionDeleteFeatureFlagSuccess, (state, { flag }) => ({
    ...state,
    selectedFlag: null, // Clear selected flag since it was deleted
    isLoadingFeatureFlagDelete: false,
  })),
  on(FeatureFlagsActions.actionDeleteFeatureFlagFailure, (state) => ({
    ...state,
    isLoadingFeatureFlagDelete: false,
  })),

  // Feature Flag Status Update Actions
  on(FeatureFlagsActions.actionUpdateFeatureFlagStatus, (state) => ({
    ...state,
    isLoadingUpdateFeatureFlagStatus: true,
  })),
  on(FeatureFlagsActions.actionUpdateFeatureFlagStatusSuccess, (state, { response }) => ({
    ...state,
    selectedFlag: state.selectedFlag?.id === response.id ? response : state.selectedFlag,
    isLoadingUpdateFeatureFlagStatus: false,
  })),
  on(FeatureFlagsActions.actionUpdateFeatureFlagStatusFailure, (state) => ({
    ...state,
    isLoadingUpdateFeatureFlagStatus: true,
  })),

  // UI State Update Actions
  on(FeatureFlagsActions.actionUpdateFilterModeSuccess, (state, { response }) => ({
    ...state,
    selectedFlag: state.selectedFlag?.id === response.id ? response : state.selectedFlag,
  })),
  on(FeatureFlagsActions.actionSetIsLoadingFeatureFlags, (state, { isLoadingFeatureFlags }) => ({
    ...state,
    isLoadingFeatureFlags,
  })),
  on(FeatureFlagsActions.actionSetIsLoadingImportFeatureFlag, (state, { isLoadingImportFeatureFlag }) => ({
    ...state,
    isLoadingImportFeatureFlag,
  })),
  on(FeatureFlagsActions.actionSetSkipFlags, (state, { skipFlags }) => ({ ...state, skipFlags })),
  on(FeatureFlagsActions.actionSetSearchKey, (state, { searchKey }) => ({ ...state, searchKey })),
  on(FeatureFlagsActions.actionSetSearchString, (state, { searchString }) => ({ ...state, searchValue: searchString })),
  on(FeatureFlagsActions.actionSetSortKey, (state, { sortKey }) => ({ ...state, sortKey })),
  on(FeatureFlagsActions.actionSetSortingType, (state, { sortingType }) => ({ ...state, sortAs: sortingType })),

  // Feature Flag Inclusion List Add Actions
  on(FeatureFlagsActions.actionAddFeatureFlagInclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(FeatureFlagsActions.actionAddFeatureFlagInclusionListSuccess, (state, { listResponse }) => {
    const { featureFlag } = listResponse;

    // Update selectedFlag if it matches the modified flag
    const updatedSelectedFlag =
      state.selectedFlag?.id === featureFlag?.id
        ? {
            ...state.selectedFlag,
            featureFlagSegmentInclusion: [listResponse, ...(state.selectedFlag.featureFlagSegmentInclusion || [])],
          }
        : state.selectedFlag;

    return {
      ...state,
      selectedFlag: updatedSelectedFlag,
      isLoadingUpsertPrivateSegmentList: false,
    };
  }),
  on(FeatureFlagsActions.actionAddFeatureFlagInclusionListFailure, (state) => {
    return { ...state, isLoadingUpsertPrivateSegmentList: false };
  }),

  // Feature Flag Inclusion List Update Actions
  on(FeatureFlagsActions.actionUpdateFeatureFlagInclusionListSuccess, (state, { listResponse }) => {
    const { featureFlag } = listResponse;

    // Update selectedFlag if it matches the modified flag
    const updatedSelectedFlag =
      state.selectedFlag?.id === featureFlag?.id && state.selectedFlag
        ? {
            ...state.selectedFlag,
            featureFlagSegmentInclusion:
              state.selectedFlag.featureFlagSegmentInclusion?.map((inclusion) =>
                inclusion.segment.id === listResponse.segment.id ? listResponse : inclusion
              ) ?? [],
          }
        : state.selectedFlag;

    return {
      ...state,
      selectedFlag: updatedSelectedFlag,
      isLoadingUpsertPrivateSegmentList: false,
    };
  }),

  // Feature Flag Inclusion List Delete Actions
  on(FeatureFlagsActions.actionDeleteFeatureFlagInclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(FeatureFlagsActions.actionDeleteFeatureFlagInclusionListSuccess, (state, { segmentId }) => {
    // Update selectedFlag if it has the segment being deleted
    const updatedSelectedFlag = state.selectedFlag
      ? {
          ...state.selectedFlag,
          featureFlagSegmentInclusion:
            state.selectedFlag.featureFlagSegmentInclusion?.filter((inclusion) => inclusion.segment.id !== segmentId) ??
            [],
        }
      : state.selectedFlag;

    return {
      ...state,
      selectedFlag: updatedSelectedFlag,
      isLoadingUpsertPrivateSegmentList: false,
    };
  }),
  on(FeatureFlagsActions.actionDeleteFeatureFlagInclusionListFailure, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: false,
  })),

  // Feature Flag Exclusion List Add Actions
  on(FeatureFlagsActions.actionAddFeatureFlagExclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(FeatureFlagsActions.actionAddFeatureFlagExclusionListSuccess, (state, { listResponse }) => {
    const { featureFlag } = listResponse;

    // Update selectedFlag if it matches the modified flag
    const updatedSelectedFlag =
      state.selectedFlag?.id === featureFlag?.id
        ? {
            ...state.selectedFlag,
            featureFlagSegmentExclusion: [listResponse, ...(state.selectedFlag.featureFlagSegmentExclusion || [])],
          }
        : state.selectedFlag;

    return {
      ...state,
      selectedFlag: updatedSelectedFlag,
      isLoadingUpsertPrivateSegmentList: false,
    };
  }),
  on(FeatureFlagsActions.actionAddFeatureFlagExclusionListFailure, (state) => {
    return { ...state, isLoadingUpsertPrivateSegmentList: false };
  }),

  // Feature Flag Exclusion List Update Actions
  on(FeatureFlagsActions.actionUpdateFeatureFlagExclusionListSuccess, (state, { listResponse }) => {
    const { featureFlag } = listResponse;

    // Update selectedFlag if it matches the modified flag
    const updatedSelectedFlag =
      state.selectedFlag?.id === featureFlag?.id && state.selectedFlag
        ? {
            ...state.selectedFlag,
            featureFlagSegmentExclusion:
              state.selectedFlag.featureFlagSegmentExclusion?.map((exclusion) =>
                exclusion.segment.id === listResponse.segment.id ? listResponse : exclusion
              ) ?? [],
          }
        : state.selectedFlag;

    return {
      ...state,
      selectedFlag: updatedSelectedFlag,
      isLoadingUpsertPrivateSegmentList: false,
    };
  }),

  // Feature Flag Exclusion List Delete Actions
  on(FeatureFlagsActions.actionDeleteFeatureFlagExclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(FeatureFlagsActions.actionDeleteFeatureFlagExclusionListSuccess, (state, { segmentId }) => {
    // Update selectedFlag if it has the segment being deleted
    const updatedSelectedFlag = state.selectedFlag
      ? {
          ...state.selectedFlag,
          featureFlagSegmentExclusion:
            state.selectedFlag.featureFlagSegmentExclusion?.filter((exclusion) => exclusion.segment.id !== segmentId) ??
            [],
        }
      : state.selectedFlag;

    return {
      ...state,
      selectedFlag: updatedSelectedFlag,
      isLoadingUpsertPrivateSegmentList: false,
    };
  }),
  on(FeatureFlagsActions.actionDeleteFeatureFlagExclusionListFailure, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: false,
  })),

  // Graph / Exposures Actions
  on(FeatureFlagsActions.actionFetchFeatureFlagGraphInfo, (state) => ({
    ...state,
    isGraphLoading: true,
    graphInfo: null,
  })),
  on(FeatureFlagsActions.actionFetchFeatureFlagGraphInfoSuccess, (state, { graphInfo }) => ({
    ...state,
    isGraphLoading: false,
    graphInfo,
  })),
  on(FeatureFlagsActions.actionFetchFeatureFlagGraphInfoFailure, (state) => ({
    ...state,
    isGraphLoading: false,
  })),
  on(FeatureFlagsActions.actionSetFeatureFlagGraphInfo, (state, { graphInfo }) => ({
    ...state,
    graphInfo,
  })),
  on(FeatureFlagsActions.actionFetchFeatureFlagTotalExposuresSuccess, (state, { totalExposures }) => ({
    ...state,
    totalExposures,
  })),
  on(FeatureFlagsActions.actionSetFeatureFlagTotalExposures, (state, { totalExposures }) => ({
    ...state,
    totalExposures,
  }))
);

export function featureFlagsReducer(state: FeatureFlagState | undefined, action: Action) {
  return reducer(state, action);
}
