import { createReducer, Action, on } from '@ngrx/store';
import { SegmentState, GlobalSegmentState } from './segments.model';
import * as SegmentsActions from './segments.actions';
import {
  SEGMENT_SEARCH_KEY,
  SORT_AS_DIRECTION,
  SEGMENT_SORT_KEY,
} from '../../../../../../../../types/src/Experiment/enums';

export const initialState: SegmentState = {
  // List page data - plain array preserves backend sort order
  segments: [],
  isLoadingSegments: false,
  hasInitialSegmentsDataLoaded: false,
  allExperimentSegmentsInclusion: null,
  allExperimentSegmentsExclusion: null,
  allFeatureFlagSegmentsInclusion: null,
  allFeatureFlagSegmentsExclusion: null,
  allParentSegments: null,
  skipSegments: 0,
  totalSegments: null,
  searchKey: SEGMENT_SEARCH_KEY.ALL,
  searchString: null,
  sortKey: SEGMENT_SORT_KEY.NAME,
  sortAs: SORT_AS_DIRECTION.ASCENDING,
  isLoadingUpsertSegment: false,
  listSegmentOptions: [],
  detailsPageError: null,
};

const reducer = createReducer(
  initialState,
  on(SegmentsActions.actionUpsertSegment, SegmentsActions.actionGetSegmentById, (state) => ({
    ...state,
    isLoadingSegments: true,
  })),
  on(
    SegmentsActions.actionFetchSegmentsSuccess,
    (
      state,
      {
        segments,
        totalSegments,
        experimentSegmentExclusion,
        experimentSegmentInclusion,
        featureFlagSegmentInclusion,
        featureFlagSegmentExclusion,
        allParentSegments,
        fromStarting,
      }
    ) => {
      const newState = {
        ...state,
        totalSegments,
        allExperimentSegmentsInclusion: experimentSegmentInclusion,
        allExperimentSegmentsExclusion: experimentSegmentExclusion,
        allFeatureFlagSegmentsInclusion: featureFlagSegmentInclusion,
        allFeatureFlagSegmentsExclusion: featureFlagSegmentExclusion,
        allParentSegments,
      };

      if (fromStarting) {
        // when going fromStarting (on any fetch other than fetch more on scroll)
        newState.skipSegments = segments.length;
        return {
          ...newState,
          segments: [...segments],
          isLoadingSegments: false,
          hasInitialSegmentsDataLoaded: true,
        };
      } else {
        // when fetching more
        newState.skipSegments = state.skipSegments + segments.length;
        return {
          ...newState,
          segments: [...state.segments, ...segments],
          isLoadingSegments: false,
          hasInitialSegmentsDataLoaded: true,
        };
      }
    }
  ),
  on(SegmentsActions.actionFetchListSegmentOptionsSuccess, (state, { listSegmentOptions }) => {
    return {
      ...state,
      listSegmentOptions,
    };
  }),
  on(
    SegmentsActions.actionFetchSegmentsFailure,
    SegmentsActions.actionUpsertSegmentFailure,
    SegmentsActions.actionUpdateSegmentSuccess,
    SegmentsActions.actionAddSegmentSuccess,
    (state) => ({ ...state, isLoadingSegments: false })
  ),
  on(SegmentsActions.actionGetSegmentByIdFailure, (state, { segmentId, errorType }) => ({
    ...state,
    isLoadingSegments: false,
    detailsPageError: { entityId: segmentId, errorType },
  })),
  on(SegmentsActions.actionUpsertSegmentSuccess, (state) => ({
    ...state,
    isLoadingSegments: false,
  })),
  on(
    SegmentsActions.actionGetSegmentByIdSuccess,
    (
      state,
      {
        segment,
        experimentSegmentExclusion,
        experimentSegmentInclusion,
        featureFlagSegmentInclusion,
        featureFlagSegmentExclusion,
        allParentSegments,
      }
    ) => {
      // Upsert segment: update if exists, add if not (for direct navigation)
      const existingIndex = state.segments.findIndex((s) => s.id === segment.id);
      let updatedSegments;
      if (existingIndex >= 0) {
        // Update existing segment
        updatedSegments = [...state.segments];
        updatedSegments[existingIndex] = segment;
      } else {
        // Add new segment (for direct navigation to detail page)
        updatedSegments = [segment, ...state.segments];
      }

      const newState = {
        ...state,
        segments: updatedSegments,
        allExperimentSegmentsInclusion: experimentSegmentInclusion,
        allExperimentSegmentsExclusion: experimentSegmentExclusion,
        allFeatureFlagSegmentsInclusion: featureFlagSegmentInclusion,
        allFeatureFlagSegmentsExclusion: featureFlagSegmentExclusion,
        allParentSegments,
        isLoadingSegments: false,
        // The error is retained while a retry is in flight (so the error page doesn't fall back to a
        // stale cached segment) and only cleared once a fetch for that same segment succeeds
        detailsPageError: state.detailsPageError?.entityId === segment.id ? null : state.detailsPageError,
      };
      return newState;
    }
  ),
  on(SegmentsActions.actionSetSearchKey, (state, { searchKey }) => ({ ...state, searchKey })),
  on(SegmentsActions.actionSetSearchString, (state, { searchString }) => ({ ...state, searchString })),
  on(SegmentsActions.actionSetSortKey, (state, { sortKey }) => ({ ...state, sortKey })),
  on(SegmentsActions.actionSetSortingType, (state, { sortingType }) => ({ ...state, sortAs: sortingType })),
  on(SegmentsActions.actionDeleteSegmentSuccess, (state, { segment }) => ({
    ...state,
    segments: state.segments.filter((s) => s.id !== segment.id),
  })),
  on(SegmentsActions.actionSetIsLoadingSegments, (state, { isLoadingSegments }) => ({ ...state, isLoadingSegments })),

  // Segment List Add Actions
  on(SegmentsActions.actionAddSegmentList, (state) => ({
    ...state,
    isLoadingSegments: true,
  })),
  on(SegmentsActions.actionAddSegmentListSuccess, onAddListSuccess),
  on(SegmentsActions.actionAddSegmentListFailure, (state) => ({
    ...state,
    isLoadingSegments: false,
  })),

  // Segment List Update Actions
  on(SegmentsActions.actionUpdateSegmentList, (state) => ({
    ...state,
    isLoadingSegments: true,
  })),
  on(SegmentsActions.actionUpdateSegmentListSuccess, onUpdateListSuccess),
  on(SegmentsActions.actionUpdateSegmentListFailure, (state) => ({
    ...state,
    isLoadingSegments: false,
  })),

  // Segment List Delete Actions
  on(SegmentsActions.actionDeleteSegmentList, (state) => ({
    ...state,
    isLoadingSegments: true,
  })),
  on(SegmentsActions.actionDeleteSegmentListSuccess, onDeleteListSuccess),
  on(SegmentsActions.actionDeleteSegmentListFailure, (state) => ({
    ...state,
    isLoadingSegments: false,
  }))
);

export function segmentsReducer(state: SegmentState | undefined, action: Action) {
  return reducer(state, action);
}

export const initalGlobalState: GlobalSegmentState = {
  segments: [],
  isLoadingSegments: false,
  sortKey: SEGMENT_SORT_KEY.NAME,
  sortAs: SORT_AS_DIRECTION.ASCENDING,
};

const globalReducer = createReducer(
  initalGlobalState,
  on(
    SegmentsActions.actionFetchGlobalSegments,
    SegmentsActions.actionAddSegmentList,
    SegmentsActions.actionUpdateSegmentList,
    SegmentsActions.actionDeleteSegmentList,
    (state) => ({
      ...state,
      isLoadingSegments: true,
    })
  ),
  on(SegmentsActions.actionUpdateSegmentListSuccess, onUpdateListSuccess),
  on(SegmentsActions.actionAddSegmentListSuccess, onAddListSuccess),
  on(SegmentsActions.actionDeleteSegmentListSuccess, onDeleteListSuccess),
  on(SegmentsActions.actionFetchGlobalSegmentsFailure, (state) => ({
    ...state,
    isLoadingSegments: false,
  })),
  on(SegmentsActions.actionFetchGlobalSegmentsSuccess, (state, { globalSegments }) => ({
    ...state,
    segments: globalSegments,
    isLoadingSegments: false,
  })),
  on(SegmentsActions.actionGetSegmentByIdSuccess, (state) => {
    return { ...state, isLoadingSegments: false };
  })
);

function onAddListSuccess(state, { listResponse }) {
  const parentSegmentId = listResponse.parentSegmentId;
  const existingSegmentIndex = state.segments.findIndex((segment) => segment.id === parentSegmentId);

  if (existingSegmentIndex >= 0) {
    const existingSegment = state.segments[existingSegmentIndex];
    // Create updated subSegments array with the new list/segment
    const updatedSubSegments = existingSegment.subSegments
      ? [...existingSegment.subSegments, listResponse.segment]
      : [listResponse.segment];

    const updatedSegments = [...state.segments];
    updatedSegments[existingSegmentIndex] = {
      ...existingSegment,
      subSegments: updatedSubSegments,
      updatedAt: listResponse.segment.updatedAt,
      versionNumber: existingSegment.versionNumber + 1,
    };

    return {
      ...state,
      segments: updatedSegments,
      isLoadingSegments: false,
    };
  }

  return { ...state, isLoadingSegments: false };
}

function onUpdateListSuccess(state, { listResponse }) {
  const parentSegmentId = listResponse.parentSegmentId;
  const existingSegmentIndex = state.segments.findIndex((segment) => segment.id === parentSegmentId);

  if (existingSegmentIndex >= 0) {
    const existingSegment = state.segments[existingSegmentIndex];
    if (existingSegment.subSegments) {
      // Create updated subSegments array replacing the edited segment
      const updatedSubSegments = existingSegment.subSegments.map((subSegment) =>
        subSegment.id === listResponse.segment.id ? listResponse.segment : subSegment
      );

      const updatedSegments = [...state.segments];
      updatedSegments[existingSegmentIndex] = {
        ...existingSegment,
        subSegments: updatedSubSegments,
      };

      return {
        ...state,
        segments: updatedSegments,
        isLoadingSegments: false,
      };
    }
  }

  return { ...state, isLoadingSegments: false };
}

function onDeleteListSuccess(state, { segmentId }) {
  // Find the parent segment that contains this subSegment
  const parentSegmentIndex = state.segments.findIndex((segment) =>
    segment.subSegments?.some((subSegment) => subSegment.id === segmentId)
  );

  if (parentSegmentIndex >= 0) {
    const parentSegment = state.segments[parentSegmentIndex];
    // Filter out the deleted subSegment
    const updatedSubSegments = parentSegment.subSegments.filter((subSegment) => subSegment.id !== segmentId);

    const updatedSegments = [...state.segments];
    updatedSegments[parentSegmentIndex] = {
      ...parentSegment,
      subSegments: updatedSubSegments,
    };

    return {
      ...state,
      segments: updatedSegments,
      isLoadingSegments: false,
    };
  }

  return { ...state, isLoadingSegments: false };
}

export function globalSegmentsReducer(state: GlobalSegmentState | undefined, action: Action) {
  return globalReducer(state, action);
}
