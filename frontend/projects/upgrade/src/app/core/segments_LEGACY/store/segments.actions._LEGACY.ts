import { createAction, props } from '@ngrx/store';
import {
  Segment_LEGACY,
  SegmentInput_LEGACY,
  UpsertSegmentType_LEGACY,
  experimentSegmentInclusionExclusionData_LEGACY,
  featureFlagSegmentInclusionExclusionData_LEGACY,
} from './segments.model._LEGACY';
import {
  SEGMENT_SEARCH_KEY,
  SORT_AS_DIRECTION,
  SEGMENT_SORT_KEY,
} from '../../../../../../../../types/src/Experiment/enums';

export const actionFetchSegments_LEGACY = createAction('[Segments] Segment', props<{ fromStarting?: boolean }>());

export const actionFetchSegmentsSuccess_LEGACY = createAction(
  '[Segments] Fetch Segments Success',
  props<{
    segments: Segment_LEGACY[];
    experimentSegmentInclusion: experimentSegmentInclusionExclusionData_LEGACY[];
    experimentSegmentExclusion: experimentSegmentInclusionExclusionData_LEGACY[];
    featureFlagSegmentInclusion: featureFlagSegmentInclusionExclusionData_LEGACY[];
    featureFlagSegmentExclusion: featureFlagSegmentInclusionExclusionData_LEGACY[];
  }>()
);

export const actionFetchSegmentsFailure_LEGACY = createAction('[Segments] Fetch Segments Failure');

export const actionUpsertSegment_LEGACY = createAction(
  '[Segments] Upsert Segment',
  props<{ segment: SegmentInput_LEGACY; actionType: UpsertSegmentType_LEGACY }>()
);

export const actionUpsertSegmentSuccess_LEGACY = createAction(
  '[Segments] Upsert Segment Success',
  props<{ segment: Segment_LEGACY }>()
);

export const actionUpsertSegmentFailure_LEGACY = createAction('[Segments] Upsert Segment Failure');

export const actionGetSegmentById_LEGACY = createAction('[Segments] Get Segment By Id', props<{ segmentId: string }>());

export const actionGetSegmentByIdSuccess_LEGACY = createAction(
  '[Segments] Get Segment By Id Success',
  props<{ segment: Segment_LEGACY }>()
);

export const actionGetSegmentByIdFailure_LEGACY = createAction('[Segments] Get Segment By Id Failure');

export const actionDeleteSegment_LEGACY = createAction('[Segments] Delete Segment', props<{ segmentId: string }>());

export const actionDeleteSegmentSuccess_LEGACY = createAction(
  '[Segments] Delete Segment Success',
  props<{ segment: Segment_LEGACY }>()
);

export const actionDeleteSegmentFailure_LEGACY = createAction('[Segments] Delete Segment Failure');

export const actionSetIsLoadingSegments_LEGACY = createAction(
  '[Segments] Set Is Loading Segments',
  props<{ isLoadingSegments: boolean }>()
);

export const actionExportSegments_LEGACY = createAction('[Segments] Export Segment', props<{ segmentIds: string[] }>());

export const actionExportSegmentSuccess_LEGACY = createAction('[Segments] Export Segment Success');

export const actionExportSegmentFailure_LEGACY = createAction('[Segments] Export Segment Failure');

export const actionSetSearchKey_LEGACY = createAction(
  '[Segments] Set Search key value',
  props<{ searchKey: SEGMENT_SEARCH_KEY }>()
);

export const actionSetSearchString_LEGACY = createAction(
  '[Segments] Set Search String',
  props<{ searchString: string }>()
);

export const actionSetSortKey_LEGACY = createAction(
  '[Segments] Set Sort key value',
  props<{ sortKey: SEGMENT_SORT_KEY }>()
);

export const actionSetSortingType_LEGACY = createAction(
  '[Segments] Set Sorting type',
  props<{ sortingType: SORT_AS_DIRECTION }>()
);
