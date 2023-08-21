import { createAction, props } from '@ngrx/store';
import { Segment, SegmentInput, UpsertSegmentType, experimentSegmentInclusionExclusionData } from './segments.model';

export const actionFetchSegments = createAction('[Segments] Segment', props<{ fromStarting?: boolean }>());

export const actionFetchSegmentsSuccess = createAction(
  '[Segments] Fetch Segments Success',
  props<{
    segments: Segment[];
    experimentSegmentInclusion: experimentSegmentInclusionExclusionData[];
    experimentSegmentExclusion: experimentSegmentInclusionExclusionData[];
  }>()
);

export const actionFetchSegmentsFailure = createAction('[Segments] Fetch Segments Failure');

export const actionUpsertSegment = createAction(
  '[Segments] Upsert Segment',
  props<{ segment: SegmentInput; actionType: UpsertSegmentType }>()
);

export const actionUpsertSegmentSuccess = createAction(
  '[Segments] Upsert Segment Success',
  props<{ segment: Segment }>()
);

export const actionUpsertSegmentFailure = createAction('[Segments] Upsert Segment Failure');

export const actionImportSegments = createAction('[Segments] Import Segment', props<{ segments: SegmentInput[] }>());

export const actionImportSegmentSuccess = createAction(
  '[Segments] Import Segment Success',
  props<{ segments: Segment[] }>()
);

export const actionImportSegmentFailure = createAction('[Segments] Import Segment Failure');

export const actionGetSegmentById = createAction('[Experiment] Get Segment By Id', props<{ segmentId: string }>());

export const actionGetSegmentByIdSuccess = createAction(
  '[Experiment] Get Segment By Id Success',
  props<{ segment: Segment }>()
);

export const actionGetSegmentByIdFailure = createAction('[Experiment] Get Segment By Id Failure');

export const actionDeleteSegment = createAction('[Segments] Delete Segment', props<{ segmentId: string }>());

export const actionDeleteSegmentSuccess = createAction(
  '[Segments] Delete Segment Success',
  props<{ segment: Segment }>()
);

export const actionDeleteSegmentFailure = createAction('[Segments] Delete Segment Failure');

export const actionSetIsLoadingSegments = createAction(
  '[Segments] Set Is Loading Segments',
  props<{ isLoadingSegments: boolean }>()
);

export const actionExportSegments = createAction('[Segments] Export Segment', props<{ segmentIds: string[] }>());

export const actionExportSegmentSuccess = createAction('[Segments] Export Segment Success');

export const actionExportSegmentFailure = createAction('[Segments] Export Segment Failure');
