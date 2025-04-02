import { createSelector, createFeatureSelector } from '@ngrx/store';
import {
  LIST_OPTION_TYPE,
  SegmentState,
  ParticipantListTableRow,
  Segment,
  UsedByTableRow,
  USED_BY_TYPE,
  experimentSegmentInclusionExclusionData,
  featureFlagSegmentInclusionExclusionData,
  GlobalSegmentState,
} from './segments.model';
import { selectAll } from './segments.reducer';
import { selectRouterState } from '../../core.state';
import { CommonTextHelpersService } from '../../../shared/services/common-text-helpers.service';
import { selectContextMetaData } from '../../experiments/store/experiments.selectors';
import { selectSelectedFeatureFlag } from '../../feature-flags/store/feature-flags.selectors';
import { SEGMENT_SEARCH_KEY, SEGMENT_TYPE } from 'upgrade_types';

export const selectSegmentsState = createFeatureSelector<SegmentState>('segments');

export const selectAllSegments = createSelector(selectSegmentsState, selectAll);

export const selectGlobalSegmentsState = createFeatureSelector<GlobalSegmentState>('globalSegments');

export const selectGlobalSegments = createSelector(selectGlobalSegmentsState, selectAll);

export const selectIsLoadingSegments = createSelector(selectSegmentsState, (state) => state.isLoadingSegments);

export const selectIsLoadingGlobalSegments = createSelector(
  selectGlobalSegmentsState,
  (state) => state.isLoadingGlobalSegments
);

export const selectSegmentById = createSelector(
  selectSegmentsState,
  (state, { segmentId }) => state.entities[segmentId]
);

export const selectExperimentSegmentsInclusion = createSelector(
  selectSegmentsState,
  (state) => state.allExperimentSegmentsInclusion
);

export const selectExperimentSegmentsExclusion = createSelector(
  selectSegmentsState,
  (state) => state.allExperimentSegmentsExclusion
);

export const selectFeatureFlagSegmentsInclusion = createSelector(
  selectSegmentsState,
  (state) => state.allFeatureFlagSegmentsInclusion
);

export const selectFeatureFlagSegmentsExclusion = createSelector(
  selectSegmentsState,
  (state) => state.allFeatureFlagSegmentsExclusion
);

export const selectAllSegmentEntities = createSelector(
  selectSegmentsState,
  selectGlobalSegmentsState,
  (segmentState, globalSegmentState) => ({
    ...segmentState.entities,
    ...globalSegmentState.entities,
  })
);

export const selectSelectedSegment = createSelector(
  selectRouterState,
  selectAllSegmentEntities,
  (routerState, allSegmentEntities) => {
    if (routerState?.state && allSegmentEntities) {
      const {
        state: { params },
      } = routerState;
      return allSegmentEntities[params.segmentId] ? allSegmentEntities[params.segmentId] : undefined;
    }
  }
);

export const selectSegmentOverviewDetails = createSelector(selectSelectedSegment, (segment) => ({
  ['Description']: segment?.description,
  ['App Context']: segment?.context,
  ['Tags']: segment?.tags,
}));

export const selectSkipSegments = createSelector(selectSegmentsState, (state) => state.skipSegments);

export const selectTotalSegments = createSelector(selectSegmentsState, (state) => state.totalSegments);

export const selectAreAllSegmentsFetched = createSelector(
  selectSkipSegments,
  selectTotalSegments,
  (skipSegments, totalSegments) => skipSegments === totalSegments
);

export const selectSearchKey = createSelector(selectSegmentsState, (state) => state.searchKey);

export const selectSearchString = createSelector(selectSegmentsState, (state) => state.searchString);

export const selectSearchSegmentParams = createSelector(
  selectSearchKey,
  selectSearchString,
  (searchKey, searchString) => {
    if (!!searchKey && (!!searchString || searchString === '')) {
      return { searchKey, searchString };
    }
    return null;
  }
);

export const selectRootTableState = createSelector(
  selectAllSegments,
  selectSearchSegmentParams,
  (tableData, searchParams) => ({
    tableData,
    searchParams,
    allSearchableProperties: Object.values(SEGMENT_SEARCH_KEY),
  })
);

export const selectGlobalTableState = createSelector(
  selectGlobalSegments,
  selectSearchSegmentParams,
  (tableData, searchParams) => ({
    tableData,
    searchParams,
    allSearchableProperties: Object.values(SEGMENT_SEARCH_KEY),
  })
);

export const selectSortKey = createSelector(selectSegmentsState, (state) => state.sortKey);

export const selectSortAs = createSelector(selectSegmentsState, (state) => state.sortAs);

export const selectGlobalSortKey = createSelector(selectGlobalSegmentsState, (state) => state.sortKey);

export const selectGlobalSortAs = createSelector(selectGlobalSegmentsState, (state) => state.sortAs);

export const selectPrivateSegmentListTypeOptions = createSelector(
  selectContextMetaData,
  selectSelectedFeatureFlag,
  (contextMetaData, flag) => {
    const flagAppContext = flag?.context?.[0];
    const groupTypes = contextMetaData?.contextMetadata?.[flagAppContext]?.GROUP_TYPES ?? [];
    const groupTypeSelectOptions = CommonTextHelpersService.formatGroupTypes(groupTypes as string[]);
    const listOptionTypes = [
      {
        value: LIST_OPTION_TYPE.SEGMENT,
        viewValue: LIST_OPTION_TYPE.SEGMENT,
      },
      {
        value: LIST_OPTION_TYPE.INDIVIDUAL,
        viewValue: LIST_OPTION_TYPE.INDIVIDUAL,
      },
      ...groupTypeSelectOptions,
    ];

    return listOptionTypes;
  }
);

export const selectSegmentLists = createSelector(
  selectSelectedSegment,
  (segment: Segment): ParticipantListTableRow[] => {
    if (!segment?.subSegments?.length) {
      return [];
    }
    return segment.subSegments
      .filter((subSegment) => subSegment)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((subSegment) => ({
        segment: subSegment,
        listType: subSegment.listType,
      }));
  }
);

export const selectShouldUseLegacyUI = createSelector(selectSelectedSegment, (segment: Segment): boolean => {
  if (segment?.type === SEGMENT_TYPE.PUBLIC) {
    // Check if the segment has individuals, groups, or non-private subsegments
    const hasIndividuals = segment.individualForSegment?.length > 0;
    const hasGroups = segment.groupForSegment?.length > 0;

    // Filter for non-private subsegments
    const hasNonPrivateSubsegments = segment.subSegments?.some(
      (subsegment) => subsegment.type !== SEGMENT_TYPE.PRIVATE
    );

    return hasIndividuals || hasGroups || hasNonPrivateSubsegments;
  }
  return false;
});

export const selectSegmentUsageData = createSelector(
  selectSelectedSegment,
  selectExperimentSegmentsInclusion,
  selectExperimentSegmentsExclusion,
  selectFeatureFlagSegmentsInclusion,
  selectFeatureFlagSegmentsExclusion,
  (segment, expInclusions, expExclusions, flagInclusions, flagExclusions) => {
    if (!segment) return [];

    // Use Map to prevent duplicates with experimentId or featureFlagId as the key
    const usedByMap = new Map<string, UsedByTableRow>();

    // Process experiment segments
    processExperimentSegments(expInclusions, segment.id, usedByMap);
    processExperimentSegments(expExclusions, segment.id, usedByMap);

    // Process feature flag segments
    processFeatureFlagSegments(flagInclusions, segment.id, usedByMap);
    processFeatureFlagSegments(flagExclusions, segment.id, usedByMap);

    // Convert Map values to array and sort by updatedAt (newest first)
    return Array.from(usedByMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
);

// Helper functions for the selector
function processExperimentSegments(
  segmentData: experimentSegmentInclusionExclusionData[],
  segmentId: string,
  resultMap: Map<string, UsedByTableRow>
) {
  if (!segmentData) return;

  segmentData.forEach((item) => {
    if (item.segment && item.segment.subSegments) {
      item.segment.subSegments.forEach((subSegment) => {
        if (subSegment.id === segmentId) {
          if (!resultMap.has(item.experimentId)) {
            resultMap.set(item.experimentId, {
              name: item.experiment.name,
              type: USED_BY_TYPE.EXPERIMENT,
              status: item.experiment.state,
              updatedAt: item.updatedAt,
              link: `/home/detail/${item.experimentId}`,
            });
          }
        }
      });
    }
  });
}

function processFeatureFlagSegments(
  segmentData: featureFlagSegmentInclusionExclusionData[],
  segmentId: string,
  resultMap: Map<string, UsedByTableRow>
) {
  if (!segmentData) return;

  segmentData.forEach((item) => {
    if (item.segment && item.segment.subSegments) {
      item.segment.subSegments.forEach((subSegment) => {
        if (subSegment.id === segmentId) {
          if (!resultMap.has(item.featureFlagId)) {
            resultMap.set(item.featureFlagId, {
              name: item.featureFlag.name,
              type: USED_BY_TYPE.FEATURE_FLAG,
              status: item.featureFlag.status,
              updatedAt: item.updatedAt,
              link: `/featureflags/detail/${item.featureFlagId}`,
            });
          }
        }
      });
    }
  });
}
