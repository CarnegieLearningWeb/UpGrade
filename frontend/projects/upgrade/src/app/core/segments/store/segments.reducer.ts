import { createReducer, Action, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { SegmentState, Segment, SEGMENTS_SEARCH_SORT_KEY } from './segments.model';
import * as SegmentsActions from './segments.actions';

export const adapter: EntityAdapter<Segment> = createEntityAdapter<
Segment
>();

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = adapter.getSelectors();

export const initialState: SegmentState = adapter.getInitialState({
  isLoadingSegments: false,
  skipSegments: 0,
  totalSegments: 0,
  searchKey: SEGMENTS_SEARCH_SORT_KEY.ALL,
  searchString: null,
  sortKey: null,
  sortAs: null
});

const reducer = createReducer(
  initialState,
  on(
    SegmentsActions.actionUpdateSegmentStatus,
    SegmentsActions.actionUpsertSegment,
    (state) => ({ ...state, isLoadingSegments: true })
  ),
  on(
    SegmentsActions.actionFetchSegmentsSuccess,
    (state, { segments, totalSegments }) => {
      const newState = {
        ...state,
        totalSegments,
        skipSegments: state.skipSegments + segments.length
      };
      return adapter.upsertMany(segments, { ...newState, isLoadingSegments: false });
    }
  ),
  on(
    SegmentsActions.actionFetchSegmentsFailure,
    SegmentsActions.actionUpdateSegmentStatusFailure,
    SegmentsActions.actionUpsertSegmentFailure,
    (state) => ({ ...state, isLoadingSegments: false })
  ),
  on(
    SegmentsActions.actionUpsertSegmentSuccess,
    (state, { segment }) => {
      return adapter.upsertOne(segment, { ...state, isLoadingSegments: false });
    }
  ),
  on(
    SegmentsActions.actionUpdateSegmentStatusSuccess,
    (state, { segment }) => {
      return adapter.updateOne({ id: segment.id, changes: segment }, { ...state, isLoadingSegments: false });
    }
  ),
  on(
    SegmentsActions.actionDeleteSegmentSuccess,
    (state, { segment }) => {
      return adapter.removeOne(segment.id, state);
    }
  ),
  on(
    SegmentsActions.actionSetIsLoadingSegments,
    (state, { isLoadingSegments }) => ({ ...state, isLoadingSegments })
  ),
  on(
    SegmentsActions.actionSetSkipSegments,
    (state, { skipSegments }) => ({ ...state, skipSegments })
  ),
  on(
    SegmentsActions.actionSetSearchKey,
    (state, { searchKey }) => ({ ...state, searchKey })
  ),
  on(
    SegmentsActions.actionSetSearchString,
    (state, { searchString }) => ({ ...state, searchString })
  ),
  on(
    SegmentsActions.actionSetSortKey,
    (state, { sortKey }) => ({ ...state, sortKey })
  ),
  on(
    SegmentsActions.actionSetSortingType,
    (state, { sortingType }) => ({ ...state, sortAs: sortingType })
  ),
);

export function segmentsReducer(
  state: SegmentState | undefined,
  action: Action
) {
  return reducer(state, action);
}
