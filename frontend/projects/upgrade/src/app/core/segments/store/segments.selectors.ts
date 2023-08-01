import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State, SegmentState } from './segments.model';
import { selectAll } from './segments.reducer';
import { selectRouterState } from '../../core.state';

export const selectSegmentsState = createFeatureSelector<SegmentState>('segments');

export const selectAllSegments = createSelector(selectSegmentsState, selectAll);

export const selectIsLoadingSegments = createSelector(selectSegmentsState, (state) => state.isLoadingSegments);

export const selectExperimentSegmentsInclusion = createSelector(
  selectSegmentsState,
  (state) => state.allExperimentSegmentsInclusion
);

export const selectExperimentSegmentsExclusion = createSelector(
  selectSegmentsState,
  (state) => state.allExperimentSegmentsExclusion
);

export const selectSelectedSegment = createSelector(
  selectRouterState,
  selectSegmentsState,
  ({ state: { params } }, segmentState) =>
    segmentState.entities[params.segmentId] ? segmentState.entities[params.segmentId] : undefined
);
