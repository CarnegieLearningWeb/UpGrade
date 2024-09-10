import { createReducer, Action, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { FeatureFlagState, FeatureFlag, FLAG_SEARCH_KEY } from './feature-flags.model';
import * as FeatureFlagsActions from './feature-flags.actions';

export const adapter: EntityAdapter<FeatureFlag> = createEntityAdapter<FeatureFlag>({
  selectId: (featureFlag: FeatureFlag) => featureFlag.id,
});

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: FeatureFlagState = adapter.getInitialState({
  isLoadingUpsertFeatureFlag: false,
  isLoadingImportFeatureFlag: false,
  isLoadingFeatureFlags: false,
  isLoadingUpdateFeatureFlagStatus: false,
  isLoadingFeatureFlagDetail: false,
  isLoadingFeatureFlagDelete: false,
  isLoadingSelectedFeatureFlag: false,
  isLoadingUpsertPrivateSegmentList: false,
  hasInitialFeatureFlagsDataLoaded: false,
  activeDetailsTabIndex: 0,
  skipFlags: 0,
  totalFlags: null,
  searchKey: FLAG_SEARCH_KEY.ALL,
  searchValue: null,
  sortKey: null,
  sortAs: null,
});

const reducer = createReducer(
  initialState,
  on(FeatureFlagsActions.actionFetchFeatureFlagsSuccess, (state, { flags, totalFlags }) => {
    const newState: FeatureFlagState = {
      ...state,
      totalFlags,
      skipFlags: state.skipFlags + flags.length,
    };
    return adapter.upsertMany(flags, {
      ...newState,
      isLoadingFeatureFlags: false,
      hasInitialFeatureFlagsDataLoaded: true,
    });
  }),
  on(FeatureFlagsActions.actionFetchFeatureFlagsFailure, (state) => ({ ...state, isLoadingFeatureFlags: false })),

  // Feature Flag Detail Actions
  on(FeatureFlagsActions.actionFetchFeatureFlagById, (state) => ({
    ...state,
    isLoadingSelectedFeatureFlag: true,
  })),
  on(FeatureFlagsActions.actionFetchFeatureFlagByIdSuccess, (state, { flag }) => {
    return adapter.upsertOne(flag, {
      ...state,
      isLoadingSelectedFeatureFlag: false,
    });
  }),
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
    (state, { response }) => adapter.upsertOne(response, { ...state, isLoadingUpsertFeatureFlag: false })
  ),
  on(FeatureFlagsActions.actionAddFeatureFlagFailure, FeatureFlagsActions.actionUpdateFeatureFlagFailure, (state) => ({
    ...state,
    isLoadingUpsertFeatureFlag: false,
  })),

  // Feature Flag Delete Actions
  on(FeatureFlagsActions.actionDeleteFeatureFlag, (state) => ({ ...state, isLoadingFeatureFlagDelete: true })),
  on(FeatureFlagsActions.actionDeleteFeatureFlagSuccess, (state, { flag }) => {
    return adapter.removeOne(flag.id, {
      ...state,
      isLoadingFeatureFlagDelete: false,
    });
  }),
  on(FeatureFlagsActions.actionDeleteFeatureFlagFailure, (state) => ({
    ...state,
    isLoadingFeatureFlagDelete: false,
  })),

  // Feature Flag Status Update Actions
  on(FeatureFlagsActions.actionUpdateFeatureFlagStatus, (state) => ({
    ...state,
    isLoadingUpdateFeatureFlagStatus: true,
  })),
  on(FeatureFlagsActions.actionUpdateFeatureFlagStatusSuccess, (state, { response }) => {
    const flag = response;
    return adapter.updateOne(
      { id: flag?.id, changes: { status: flag?.status } },
      { ...state, isLoadingUpdateFeatureFlagStatus: false }
    );
  }),
  on(FeatureFlagsActions.actionUpdateFeatureFlagStatusFailure, (state) => ({
    ...state,
    isLoadingUpdateFeatureFlagStatus: true,
  })),

  // UI State Update Actions
  on(FeatureFlagsActions.actionUpdateFilterModeSuccess, (state, { response }) => {
    const flag = response;
    return adapter.updateOne({ id: flag?.id, changes: { filterMode: flag?.filterMode } }, { ...state });
  }),
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
  on(FeatureFlagsActions.actionSetActiveDetailsTabIndex, (state, { activeDetailsTabIndex }) => ({
    ...state,
    activeDetailsTabIndex,
  })),

  // Feature Flag Inclusion List Add Actions
  on(FeatureFlagsActions.actionAddFeatureFlagInclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(FeatureFlagsActions.actionAddFeatureFlagInclusionListSuccess, (state, { listResponse }) => {
    const { featureFlag } = listResponse;
    const existingFlag = state.entities[featureFlag?.id];

    return adapter.updateOne(
      {
        id: featureFlag?.id,
        changes: { featureFlagSegmentInclusion: [listResponse, ...existingFlag.featureFlagSegmentInclusion] },
      },
      { ...state }
    );
  }),
  on(FeatureFlagsActions.actionAddFeatureFlagInclusionListFailure, (state) => {
    return { ...state, isLoadingUpsertPrivateSegmentList: false };
  }),

  // Feature Flag Inclusion List Update Actions
  on(FeatureFlagsActions.actionUpdateFeatureFlagInclusionListSuccess, (state, { listResponse }) => {
    const { featureFlag } = listResponse;
    const existingFlag = state.entities[featureFlag?.id];

    if (existingFlag) {
      const updatedInclusions =
        existingFlag.featureFlagSegmentInclusion?.map((inclusion) =>
          inclusion.segment.id === listResponse.segment.id ? listResponse : inclusion
        ) ?? [];

      return adapter.updateOne(
        {
          id: featureFlag.id,
          changes: { featureFlagSegmentInclusion: updatedInclusions },
        },
        { ...state, isLoadingUpsertPrivateSegmentList: false }
      );
    }

    return state;
  }),

  // Feature Flag Inclusion List Delete Actions
  on(FeatureFlagsActions.actionDeleteFeatureFlagInclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(FeatureFlagsActions.actionDeleteFeatureFlagInclusionListSuccess, (state, { segmentId }) => {
    const updatedState = { ...state, isLoadingUpsertPrivateSegmentList: false };
    const flagId = Object.keys(state.entities).find((id) =>
      state.entities[id].featureFlagSegmentInclusion?.some((inclusion) => inclusion.segment.id === segmentId)
    );

    if (flagId) {
      const flag = state.entities[flagId];
      const updatedInclusions =
        flag.featureFlagSegmentInclusion?.filter((inclusion) => inclusion.segment.id !== segmentId) ?? [];

      return adapter.updateOne(
        {
          id: flagId,
          changes: { featureFlagSegmentInclusion: updatedInclusions },
        },
        updatedState
      );
    }

    return updatedState;
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
    const existingFlag = state.entities[featureFlag?.id];

    return adapter.updateOne(
      {
        id: featureFlag?.id,
        changes: { featureFlagSegmentExclusion: [listResponse, ...existingFlag.featureFlagSegmentExclusion] },
      },
      { ...state }
    );
  }),
  on(FeatureFlagsActions.actionAddFeatureFlagExclusionListFailure, (state) => {
    return { ...state, isLoadingUpsertPrivateSegmentList: false };
  }),

  // Feature Flag Exclusion List Update Actions
  on(FeatureFlagsActions.actionUpdateFeatureFlagExclusionListSuccess, (state, { listResponse }) => {
    const { featureFlag } = listResponse;
    const existingFlag = state.entities[featureFlag?.id];

    if (existingFlag) {
      const updatedExclusions =
        existingFlag.featureFlagSegmentExclusion?.map((exclusion) =>
          exclusion.segment.id === listResponse.segment.id ? listResponse : exclusion
        ) ?? [];

      return adapter.updateOne(
        {
          id: featureFlag.id,
          changes: { featureFlagSegmentExclusion: updatedExclusions },
        },
        { ...state, isLoadingUpsertPrivateSegmentList: false }
      );
    }

    return state;
  }),

  // Feature Flag Exclusion List Delete Actions
  on(FeatureFlagsActions.actionDeleteFeatureFlagExclusionList, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: true,
  })),
  on(FeatureFlagsActions.actionDeleteFeatureFlagExclusionListSuccess, (state, { segmentId }) => {
    const updatedState = { ...state, isLoadingUpsertPrivateSegmentList: false };
    const flagId = Object.keys(state.entities).find((id) =>
      state.entities[id].featureFlagSegmentExclusion?.some((exclusion) => exclusion.segment.id === segmentId)
    );

    if (flagId) {
      const flag = state.entities[flagId];
      const updatedExclusions =
        flag.featureFlagSegmentExclusion?.filter((exclusion) => exclusion.segment.id !== segmentId) ?? [];

      return adapter.updateOne(
        {
          id: flagId,
          changes: { featureFlagSegmentExclusion: updatedExclusions },
        },
        updatedState
      );
    }

    return updatedState;
  }),
  on(FeatureFlagsActions.actionDeleteFeatureFlagExclusionListFailure, (state) => ({
    ...state,
    isLoadingUpsertPrivateSegmentList: false,
  }))
);

export function featureFlagsReducer(state: FeatureFlagState | undefined, action: Action) {
  return reducer(state, action);
}
