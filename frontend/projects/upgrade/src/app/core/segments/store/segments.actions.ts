import { createAction, props } from '@ngrx/store';
import {
  AddPrivateSegmentListRequest,
  AddSegmentRequest,
  EditPrivateSegmentListRequest,
  ListSegmentOption,
  Segment,
  SegmentInput,
  UpdateSegmentRequest,
  UpsertSegmentType,
  experimentSegmentInclusionExclusionData,
  featureFlagSegmentInclusionExclusionData,
} from './segments.model';
import {
  SEGMENT_SEARCH_KEY,
  SORT_AS_DIRECTION,
  SEGMENT_SORT_KEY,
} from '../../../../../../../../types/src/Experiment/enums';
import { FeatureFlagSegmentListDetails } from '../../feature-flags/store/feature-flags.model';

export const actionFetchSegments = createAction('[Segments] Segments', props<{ fromStarting?: boolean }>());

export const actionFetchSegmentsSuccess = createAction(
  '[Segments] Fetch Segments Success',
  props<{
    segments: Segment[];
    totalSegments: number;
    experimentSegmentInclusion: experimentSegmentInclusionExclusionData[];
    experimentSegmentExclusion: experimentSegmentInclusionExclusionData[];
    featureFlagSegmentInclusion: featureFlagSegmentInclusionExclusionData[];
    featureFlagSegmentExclusion: featureFlagSegmentInclusionExclusionData[];
    fromStarting?: boolean;
  }>()
);

export const actionfetchAllSegments = createAction(
  '[Segments] Segments Legacy GET All',
  props<{ fromStarting?: boolean }>()
);

export const actionFetchSegmentsSuccessLegacyGetAll = createAction(
  '[Segments] Fetch Segments Success Legacy GET All',
  props<{
    segments: Segment[];
    experimentSegmentInclusion: experimentSegmentInclusionExclusionData[];
    experimentSegmentExclusion: experimentSegmentInclusionExclusionData[];
    featureFlagSegmentInclusion: featureFlagSegmentInclusionExclusionData[];
    featureFlagSegmentExclusion: featureFlagSegmentInclusionExclusionData[];
  }>()
);

export const actionFetchSegmentsFailure = createAction('[Segments] Fetch Segments Failure (Legacy GET all)');

export const actionFetchListSegmentOptions = createAction(
  '[Segments] Fetch Segments Legacy GET All for listSegmentOptions'
);

export const actionFetchListSegmentOptionsSuccess = createAction(
  '[Segments] Fetch Segments Success Legacy GET All for listSegmentOptions',
  props<{
    listSegmentOptions: ListSegmentOption[];
  }>()
);

export const actionFetchListSegmentOptionsFailure = createAction(
  '[Segments] Fetch Segments Failure Legacy GET All for listSegmentOptions'
);

export const actionFetchGlobalSegments = createAction(
  '[Global Segments] Fetch Global Segments',
  props<{ fromStarting?: boolean }>()
);

export const actionFetchGlobalSegmentsSuccess = createAction(
  '[Global Segments] Fetch Global Segments Success',
  props<{
    globalSegments: Segment[];
  }>()
);

export const actionFetchGlobalSegmentsFailure = createAction('[Global Segments] Fetch GLobal Segments Failure');

export const actionUpsertSegment = createAction(
  '[Segments] Upsert Segment',
  props<{ segment: SegmentInput; actionType: UpsertSegmentType }>()
);

export const actionUpsertSegmentSuccess = createAction(
  '[Segments] Upsert Segment Success',
  props<{ segment: Segment }>()
);

export const actionUpsertSegmentFailure = createAction('[Segments] Upsert Segment Failure');

export const actionAddSegment = createAction(
  '[Segments] Add Segment',
  props<{ addSegmentRequest: AddSegmentRequest }>()
);

export const actionAddSegmentSuccess = createAction('[Segments] Add Segment Success', props<{ segment: Segment }>());

export const actionAddSegmentFailure = createAction('[Segments] Add Segment Failure');

export const actionUpdateSegment = createAction(
  '[Segments] Update Segment',
  props<{ updateSegmentRequest: UpdateSegmentRequest }>()
);

export const actionUpdateSegmentSuccess = createAction(
  '[Segments] Update Segment Success',
  props<{ segment: Segment }>()
);

export const actionUpdateSegmentFailure = createAction('[Segments] Update Segment Failure');

export const actionGetSegmentById = createAction('[Segments] Get Segment By Id', props<{ segmentId: string }>());

export const actionGetSegmentByIdSuccess = createAction(
  '[Segments] Get Segment By Id Success',
  props<{
    segment: Segment;
    experimentSegmentInclusion: experimentSegmentInclusionExclusionData[];
    experimentSegmentExclusion: experimentSegmentInclusionExclusionData[];
    featureFlagSegmentInclusion: featureFlagSegmentInclusionExclusionData[];
    featureFlagSegmentExclusion: featureFlagSegmentInclusionExclusionData[];
  }>()
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

export const actionSetSkipSegments = createAction('[Segments] Set Skip Segments', props<{ skipSegments: number }>());

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

export const actionSetGlobalSortKey = createAction(
  '[Global Segments] Set Sort key value',
  props<{ sortKey: SEGMENT_SORT_KEY }>()
);

export const actionSetGlobalSortingType = createAction(
  '[Global Segments] Set Sorting type',
  props<{ sortingType: SORT_AS_DIRECTION }>()
);

export const actionAddSegmentList = createAction(
  '[Segments] Add Segment List',
  props<{ list: AddPrivateSegmentListRequest }>()
);

export const actionAddSegmentListSuccess = createAction(
  '[Segments] Add Segment List Success',
  props<{ listResponse: FeatureFlagSegmentListDetails }>()
);

export const actionAddSegmentListFailure = createAction('[Segments] Add Segment List Failure', props<{ error: any }>());

export const actionUpdateSegmentList = createAction(
  '[Segments] Update Segment List',
  props<{ list: EditPrivateSegmentListRequest }>()
);

export const actionUpdateSegmentListSuccess = createAction(
  '[Segments] Update Segment List Success',
  props<{ listResponse: FeatureFlagSegmentListDetails }>()
);

export const actionUpdateSegmentListFailure = createAction(
  '[Segments] Update Segment List Failure',
  props<{ error: any }>()
);

export const actionDeleteSegmentList = createAction(
  '[Segments] Delete Segment List',
  props<{ segmentId: string; parentSegmentId: string }>()
);

export const actionDeleteSegmentListSuccess = createAction(
  '[Segments] Delete Segment List Success',
  props<{ segmentId: string }>()
);

export const actionDeleteSegmentListFailure = createAction(
  '[Segments] Delete Segment List Failure',
  props<{ error: any }>()
);
