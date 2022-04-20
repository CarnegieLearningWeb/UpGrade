import { createAction, props } from '@ngrx/store';
import { Segment, UpsertSegmentType, SEGMENTS_SEARCH_SORT_KEY, SORT_AS } from './segments.model';

export const actionFetchSegments = createAction(
  '[Segments] Segment',
  props<{ fromStarting?: boolean }>()
);

export const actionFetchSegmentsSuccess = createAction(
  '[Segments] Fetch Segments Success',
  props<{ segments: Segment[], totalSegments: number }>()
);

export const actionFetchSegmentsFailure = createAction(
  '[Segments] Fetch Segments Failure'
);

export const actionUpsertSegment = createAction(
  '[Segments] Upsert Segment',
  props<{ segment: Segment, actionType: UpsertSegmentType }>()
);

export const actionUpsertSegmentSuccess = createAction(
  '[Segments] Upsert Segment Success',
  props<{ segment: Segment }>()
);

export const actionUpsertSegmentFailure = createAction(
  '[Segments] Upsert Segment Failure',
);

export const actionUpdateSegmentStatus = createAction(
  '[Segments] Update Segment Status',
  props<{ segmentId: string, status: boolean }>()
);

export const actionUpdateSegmentStatusSuccess = createAction(
  '[Segments] Update Segment Status Success',
  props<{ segment: Segment }>()
);

export const actionUpdateSegmentStatusFailure = createAction(
  '[Segments] Update Segment Status Failure',
);

export const actionDeleteSegment = createAction(
  '[Segments] Delete Segment',
  props<{ segmentId: string }>()
);

export const actionDeleteSegmentSuccess = createAction(
  '[Segments] Delete Segment Success',
  props<{ segment: Segment }>()
);

export const actionDeleteSegmentFailure = createAction(
  '[Segments] Delete Segment Failure',
);

export const actionSetIsLoadingSegments = createAction(
  '[Segments] Set Is Loading Segments',
  props<{ isLoadingSegments: boolean }>()
);

export const actionSetSkipSegments = createAction(
  '[Segments] Set Skip Segment',
  props<{ skipSegments: number }>()
);

export const actionSetSearchKey = createAction(
  '[Segments] Set Search key value',
  props<{ searchKey: SEGMENTS_SEARCH_SORT_KEY }>()
);

export const actionSetSearchString = createAction(
  '[Segments] Set Search String',
  props<{ searchString: string }>()
);

export const actionSetSortKey = createAction(
  '[Segments] Set Sort key value',
  props<{ sortKey: SEGMENTS_SEARCH_SORT_KEY }>()
);

export const actionSetSortingType = createAction(
  '[Segments] Set Sorting type',
  props<{ sortingType: SORT_AS }>()
);
