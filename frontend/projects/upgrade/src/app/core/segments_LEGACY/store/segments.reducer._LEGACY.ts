import { createReducer, Action, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { SegmentState_LEGACY, Segment_LEGACY } from './segments.model._LEGACY';
import * as SegmentsActions from './segments.actions._LEGACY';
import {
  SEGMENT_SEARCH_KEY,
  SORT_AS_DIRECTION,
  SEGMENT_SORT_KEY,
} from '../../../../../../../../types/src/Experiment/enums';

export const adapter: EntityAdapter<Segment_LEGACY> = createEntityAdapter<Segment_LEGACY>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: SegmentState_LEGACY = adapter.getInitialState({
  isLoadingSegments: false,
  allExperimentSegmentsInclusion: null,
  allExperimentSegmentsExclusion: null,
  allFeatureFlagSegmentsInclusion: null,
  allFeatureFlagSegmentsExclusion: null,
  searchKey: SEGMENT_SEARCH_KEY.ALL,
  searchString: null,
  sortKey: SEGMENT_SORT_KEY.NAME,
  sortAs: SORT_AS_DIRECTION.ASCENDING,
});

const reducer = createReducer(
  initialState,
  on(
    SegmentsActions.actionUpsertSegment_LEGACY,
    SegmentsActions.actionGetSegmentById_LEGACY,
    SegmentsActions.actionFetchSegments_LEGACY,
    (state) => ({
      ...state,
      isLoadingSegments: true,
    })
  ),
  on(
    SegmentsActions.actionFetchSegmentsSuccess_LEGACY,
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
    SegmentsActions.actionFetchSegmentsFailure_LEGACY,
    SegmentsActions.actionUpsertSegmentFailure_LEGACY,
    SegmentsActions.actionGetSegmentByIdFailure_LEGACY,
    (state) => ({ ...state, isLoadingSegments: false })
  ),
  on(SegmentsActions.actionUpsertSegmentSuccess_LEGACY, (state, { segment }) =>
    adapter.upsertOne(segment, { ...state, isLoadingSegments: false })
  ),
  on(SegmentsActions.actionGetSegmentByIdSuccess_LEGACY, (state, { segment }) =>
    adapter.upsertOne(segment, { ...state, isLoadingSegments: false })
  ),
  on(SegmentsActions.actionSetSearchKey_LEGACY, (state, { searchKey }) => ({ ...state, searchKey })),
  on(SegmentsActions.actionSetSearchString_LEGACY, (state, { searchString }) => ({ ...state, searchString })),
  on(SegmentsActions.actionSetSortKey_LEGACY, (state, { sortKey }) => ({ ...state, sortKey })),
  on(SegmentsActions.actionSetSortingType_LEGACY, (state, { sortingType }) => ({ ...state, sortAs: sortingType })),
  on(SegmentsActions.actionDeleteSegmentSuccess_LEGACY, (state, { segment }) => adapter.removeOne(segment.id, state)),
  on(SegmentsActions.actionSetIsLoadingSegments_LEGACY, (state, { isLoadingSegments }) => ({
    ...state,
    isLoadingSegments,
  }))
);

export function segmentsReducer_LEGACY(state: SegmentState_LEGACY | undefined, action: Action) {
  return reducer(state, action);
}
