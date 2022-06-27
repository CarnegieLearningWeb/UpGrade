import { createReducer, Action, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { SegmentState, Segment } from './segments.model';
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
  allExperimentSegmentsInclusion: null,
  allExperimentSegmentsExclusion: null,
});

const reducer = createReducer(
  initialState,
  on(
    SegmentsActions.actionUpsertSegment,
    SegmentsActions.actionGetSegmentById,
    (state) => ({ ...state, isLoadingSegments: true })
  ),
  on(
    SegmentsActions.actionFetchSegmentsSuccess,
    (state, { segments, experimentSegmentExclusion, experimentSegmentInclusion }) => {
      const newState = {
        ...state,
        segments,
        allExperimentSegmentsInclusion: experimentSegmentInclusion,
        allExperimentSegmentsExclusion: experimentSegmentExclusion
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
  on(
    SegmentsActions.actionUpsertSegmentSuccess,
    (state, { segment }) => {
      return adapter.upsertOne(segment, { ...state, isLoadingSegments: false });
    }
  ),
  on(
    SegmentsActions.actionGetSegmentByIdSuccess,
    (state, { segment }) => {
      return adapter.upsertOne(segment, { ...state, isLoadingSegments: false });
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
  )
);

export function segmentsReducer(
  state: SegmentState | undefined,
  action: Action
) {
  return reducer(state, action);
}
