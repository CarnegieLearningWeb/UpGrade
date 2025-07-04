import { createReducer, Action, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { SegmentState, Segment, GlobalSegmentState } from './segments.model';
import * as SegmentsActions from './segments.actions';
import {
  SEGMENT_SEARCH_KEY,
  SORT_AS_DIRECTION,
  SEGMENT_SORT_KEY,
  SEGMENT_TYPE,
} from '../../../../../../../../types/src/Experiment/enums';

export const adapter: EntityAdapter<Segment> = createEntityAdapter<Segment>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: SegmentState = adapter.getInitialState({
  isLoadingSegments: false,
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
});

const reducer = createReducer(
  initialState,
  on(
    SegmentsActions.actionUpsertSegment,
    SegmentsActions.actionGetSegmentById,
    SegmentsActions.actionfetchAllSegments,
    (state) => ({
      ...state,
      isLoadingSegments: true,
    })
  ),
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
        return adapter.setAll(segments, { ...newState, isLoadingSegments: false });
      } else {
        // when fetching more
        newState.skipSegments = state.skipSegments + segments.length;
        return adapter.upsertMany(segments, { ...newState, isLoadingSegments: false });
      }
    }
  ),
  on(
    SegmentsActions.actionFetchSegmentsSuccessLegacyGetAll,
    (
      state,
      {
        segments,
        experimentSegmentExclusion,
        experimentSegmentInclusion,
        featureFlagSegmentInclusion,
        featureFlagSegmentExclusion,
        allParentSegments,
      }
    ) => {
      const newState = {
        ...state,
        segments,
        allExperimentSegmentsInclusion: experimentSegmentInclusion,
        allExperimentSegmentsExclusion: experimentSegmentExclusion,
        allFeatureFlagSegmentsInclusion: featureFlagSegmentInclusion,
        allFeatureFlagSegmentsExclusion: featureFlagSegmentExclusion,
        allParentSegments,
      };
      return adapter.upsertMany(segments, { ...newState, isLoadingSegments: false });
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
    SegmentsActions.actionGetSegmentByIdFailure,
    SegmentsActions.actionUpdateSegmentSuccess,
    SegmentsActions.actionAddSegmentSuccess,
    (state) => ({ ...state, isLoadingSegments: false })
  ),
  on(SegmentsActions.actionUpsertSegmentSuccess, (state, { segment }) =>
    adapter.upsertOne(segment, { ...state, isLoadingSegments: false })
  ),
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
      const newState = {
        ...state,
        allExperimentSegmentsInclusion: experimentSegmentInclusion,
        allExperimentSegmentsExclusion: experimentSegmentExclusion,
        allFeatureFlagSegmentsInclusion: featureFlagSegmentInclusion,
        allFeatureFlagSegmentsExclusion: featureFlagSegmentExclusion,
        allParentSegments,
      };
      if (segment.type !== SEGMENT_TYPE.GLOBAL_EXCLUDE) {
        return adapter.upsertOne(segment, { ...newState, isLoadingSegments: false });
      }
      return { ...state, isLoadingSegments: false };
    }
  ),
  on(SegmentsActions.actionSetSearchKey, (state, { searchKey }) => ({ ...state, searchKey })),
  on(SegmentsActions.actionSetSearchString, (state, { searchString }) => ({ ...state, searchString })),
  on(SegmentsActions.actionSetSortKey, (state, { sortKey }) => ({ ...state, sortKey })),
  on(SegmentsActions.actionSetSortingType, (state, { sortingType }) => ({ ...state, sortAs: sortingType })),
  on(SegmentsActions.actionDeleteSegmentSuccess, (state, { segment }) => adapter.removeOne(segment.id, state)),
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

export const initalGlobalState: GlobalSegmentState = adapter.getInitialState({
  isLoadingSegments: false,
  sortKey: SEGMENT_SORT_KEY.NAME,
  sortAs: SORT_AS_DIRECTION.ASCENDING,
});

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
  on(SegmentsActions.actionFetchGlobalSegmentsSuccess, (state, { globalSegments }) =>
    adapter.upsertMany(globalSegments, { ...state, isLoadingSegments: false })
  ),
  on(SegmentsActions.actionGetSegmentByIdSuccess, (state, { segment }) => {
    if (segment.type === SEGMENT_TYPE.GLOBAL_EXCLUDE) {
      return adapter.upsertOne(segment, { ...state, isLoadingSegments: false });
    }
    return { ...state, isLoadingSegments: false };
  })
);

function onAddListSuccess(state, { listResponse }) {
  const parentSegmentId = listResponse.parentSegmentId;
  const existingSegment = state.entities[parentSegmentId];

  if (existingSegment) {
    // Create updated subSegments array with the new list/segment
    const updatedSubSegments = existingSegment.subSegments
      ? [...existingSegment.subSegments, listResponse.segment]
      : [listResponse.segment];

    return adapter.updateOne(
      {
        id: parentSegmentId,
        changes: {
          subSegments: updatedSubSegments,
          updatedAt: listResponse.segment.updatedAt,
          versionNumber: existingSegment.versionNumber + 1,
        },
      },
      { ...state, isLoadingSegments: false }
    );
  }

  return { ...state, isLoadingSegments: false };
}

function onUpdateListSuccess(state, { listResponse }) {
  const parentSegmentId = listResponse.parentSegmentId;
  const existingSegment = state.entities[parentSegmentId];

  if (existingSegment && existingSegment.subSegments) {
    // Create updated subSegments array replacing the edited segment
    const updatedSubSegments = existingSegment.subSegments.map((subSegment) =>
      subSegment.id === listResponse.segment.id ? listResponse.segment : subSegment
    );

    return adapter.updateOne(
      {
        id: parentSegmentId,
        changes: { subSegments: updatedSubSegments },
      },
      { ...state, isLoadingSegments: false }
    );
  }

  return { ...state, isLoadingSegments: false };
}

function onDeleteListSuccess(state, { segmentId }) {
  // Find the parent segment that contains this subSegment
  const parentSegmentId = Object.keys(state.entities).find((id) =>
    state.entities[id]?.subSegments?.some((subSegment) => subSegment.id === segmentId)
  );

  if (parentSegmentId) {
    const parentSegment = state.entities[parentSegmentId];

    // Filter out the deleted subSegment
    const updatedSubSegments = parentSegment.subSegments.filter((subSegment) => subSegment.id !== segmentId);

    return adapter.updateOne(
      {
        id: parentSegmentId,
        changes: { subSegments: updatedSubSegments },
      },
      { ...state, isLoadingSegments: false }
    );
  }

  return { ...state, isLoadingSegments: false };
}

export function globalSegmentsReducer(state: GlobalSegmentState | undefined, action: Action) {
  return globalReducer(state, action);
}
