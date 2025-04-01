import { createReducer, Action, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { SegmentState, Segment } from './segments.model';
import * as SegmentsActions from './segments.actions';
import {
  SEGMENT_SEARCH_KEY,
  SORT_AS_DIRECTION,
  SEGMENT_SORT_KEY,
} from '../../../../../../../../types/src/Experiment/enums';

export const adapter: EntityAdapter<Segment> = createEntityAdapter<Segment>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: SegmentState = adapter.getInitialState({
  isLoadingSegments: false,
  allExperimentSegmentsInclusion: null,
  allExperimentSegmentsExclusion: null,
  allFeatureFlagSegmentsInclusion: null,
  allFeatureFlagSegmentsExclusion: null,
  skipSegments: 0,
  totalSegments: null,
  searchKey: SEGMENT_SEARCH_KEY.ALL,
  searchString: null,
  sortKey: SEGMENT_SORT_KEY.NAME,
  sortAs: SORT_AS_DIRECTION.ASCENDING,
  isLoadingUpsertSegment: false,
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
      }
    ) => {
      const newState = {
        ...state,
        segments,
        totalSegments,
        skipSegments: state.skipSegments + segments.length,
        allExperimentSegmentsInclusion: experimentSegmentInclusion,
        allExperimentSegmentsExclusion: experimentSegmentExclusion,
        allFeatureFlagSegmentsInclusion: featureFlagSegmentInclusion,
        allFeatureFlagSegmentsExclusion: featureFlagSegmentExclusion,
      };
      return adapter.upsertMany(segments, { ...newState, isLoadingSegments: false });
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
      }
    ) => {
      const newState = {
        ...state,
        segments,
        allExperimentSegmentsInclusion: experimentSegmentInclusion,
        allExperimentSegmentsExclusion: experimentSegmentExclusion,
        allFeatureFlagSegmentsInclusion: featureFlagSegmentInclusion,
        allFeatureFlagSegmentsExclusion: featureFlagSegmentExclusion,
      };
      return adapter.upsertMany(segments, { ...newState, isLoadingSegments: false });
    }
  ),
  on(
    SegmentsActions.actionFetchSegmentsFailure,
    SegmentsActions.actionUpsertSegmentFailure,
    SegmentsActions.actionGetSegmentByIdFailure,
    (state) => ({ ...state, isLoadingSegments: false })
  ),
  on(SegmentsActions.actionUpsertSegmentSuccess, (state, { segment }) =>
    adapter.upsertOne(segment, { ...state, isLoadingSegments: false })
  ),
  on(SegmentsActions.actionGetSegmentByIdSuccess, (state, { segment }) =>
    adapter.upsertOne(segment, { ...state, isLoadingSegments: false })
  ),
  on(SegmentsActions.actionSetSearchKey, (state, { searchKey }) => ({ ...state, searchKey })),
  on(SegmentsActions.actionSetSearchString, (state, { searchString }) => ({ ...state, searchString })),
  on(SegmentsActions.actionSetSortKey, (state, { sortKey }) => ({ ...state, sortKey })),
  on(SegmentsActions.actionSetSortingType, (state, { sortingType }) => ({ ...state, sortAs: sortingType })),
  on(SegmentsActions.actionDeleteSegmentSuccess, (state, { segment }) => adapter.removeOne(segment.id, state)),
  on(SegmentsActions.actionSetIsLoadingSegments, (state, { isLoadingSegments }) => ({ ...state, isLoadingSegments }))
);

export function segmentsReducer(state: SegmentState | undefined, action: Action) {
  return reducer(state, action);
}
