import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State, SegmentState } from './segments.model';
import { selectAll } from './segments.reducer';
import { selectRouterState } from '../../core.state';

export const selectSegmentsState = createFeatureSelector<
  State,
  SegmentState
>('segments');

export const selectAllSegments = createSelector(
  selectSegmentsState,
  selectAll
);

export const selectIsLoadingSegments = createSelector(
  selectSegmentsState,
  (state) => state
);

export const selectSelectedSegment = createSelector(
  selectRouterState,
  selectSegmentsState,
  ({ state: { params } }, segmentState) => {
    return segmentState.entities[params.segmentId]
      ? segmentState.entities[params.segmentId]
      : undefined;
  }
);

export const selectSkipSegments = createSelector(
  selectSegmentsState,
  (state) => state.skipSegments
);

export const selectTotalSegments = createSelector(
  selectSegmentsState,
  (state) => state.totalSegments
);

export const selectSearchKey = createSelector(
  selectSegmentsState,
  (state) => state.searchKey
);

export const selectSearchString = createSelector(
  selectSegmentsState,
  (state) => state.searchString
);

export const selectSortKey = createSelector(
  selectSegmentsState,
  (state) => state.sortKey
);

export const selectSortAs = createSelector(
  selectSegmentsState,
  (state) => state.sortAs
);
