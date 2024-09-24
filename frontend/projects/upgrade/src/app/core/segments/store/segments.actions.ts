import { createAction, props } from '@ngrx/store';
import {
  Segment,
  SegmentInput,
  UpsertSegmentType,
  experimentSegmentInclusionExclusionData,
  featureFlagSegmentInclusionExclusionData,
} from './segments.model';
import {
  SEGMENT_SEARCH_KEY,
  SORT_AS_DIRECTION,
  SEGMENT_SORT_KEY,
} from '../../../../../../../../types/src/Experiment/enums';

export const actionFetchSegments = createAction('[Segments] Segment', props<{ fromStarting?: boolean }>());

export const actionFetchSegmentsSuccess = createAction(
  '[Segments] Fetch Segments Success',
  props<{
    segments: Segment[];
    experimentSegmentInclusion: experimentSegmentInclusionExclusionData[];
    experimentSegmentExclusion: experimentSegmentInclusionExclusionData[];
    featureFlagSegmentInclusion: featureFlagSegmentInclusionExclusionData[];
    featureFlagSegmentExclusion: featureFlagSegmentInclusionExclusionData[];
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

export const actionGetSegmentById = createAction('[Segments] Get Segment By Id', props<{ segmentId: string }>());

export const actionGetSegmentByIdSuccess = createAction(
  '[Segments] Get Segment By Id Success',
  props<{ segment: Segment }>()
);

export const actionGetSegmentByIdFailure = createAction('[Segments] Get Segment By Id Failure');

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

export const actionSetSearchKey = createAction(
  '[Segments] Set Search key value',
  props<{ searchKey: SEGMENT_SEARCH_KEY }>()
);

export const actionSetSearchString = createAction('[Segments] Set Search String', props<{ searchString: string }>());

export const actionSetSortKey = createAction('[Segments] Set Sort key value', props<{ sortKey: SEGMENT_SORT_KEY }>());

export const actionSetSortingType = createAction(
  '[Segments] Set Sorting type',
  props<{ sortingType: SORT_AS_DIRECTION }>()
);
