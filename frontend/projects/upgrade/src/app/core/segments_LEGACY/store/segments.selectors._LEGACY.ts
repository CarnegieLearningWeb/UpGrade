import { createSelector, createFeatureSelector } from '@ngrx/store';
import { LIST_OPTION_TYPE_LEGACY, SegmentState_LEGACY } from './segments.model._LEGACY';
import { selectAll } from './segments.reducer._LEGACY';
import { selectRouterState } from '../../core.state';
import { CommonTextHelpersService } from '../../../shared/services/common-text-helpers.service';
import { selectContextMetaData } from '../../experiments/store/experiments.selectors';
import { selectSelectedFeatureFlag } from '../../feature-flags/store/feature-flags.selectors';

export const selectSegmentsState_LEGACY = createFeatureSelector<SegmentState_LEGACY>('segments_LEGACY');

export const selectAllSegments_LEGACY = createSelector(selectSegmentsState_LEGACY, selectAll);

export const selectIsLoadingSegments_LEGACY = createSelector(
  selectSegmentsState_LEGACY,
  (state) => state.isLoadingSegments
);

export const selectSegmentById_LEGACY = createSelector(
  selectSegmentsState_LEGACY,
  (state, { segmentId }) => state.entities[segmentId]
);

export const selectExperimentSegmentsInclusion_LEGACY = createSelector(
  selectSegmentsState_LEGACY,
  (state) => state.allExperimentSegmentsInclusion
);

export const selectExperimentSegmentsExclusion_LEGACY = createSelector(
  selectSegmentsState_LEGACY,
  (state) => state.allExperimentSegmentsExclusion
);

export const selectFeatureFlagSegmentsInclusion_LEGACY = createSelector(
  selectSegmentsState_LEGACY,
  (state) => state.allFeatureFlagSegmentsInclusion
);

export const selectFeatureFlagSegmentsExclusion_LEGACY = createSelector(
  selectSegmentsState_LEGACY,
  (state) => state.allFeatureFlagSegmentsExclusion
);

export const selectSelectedSegment_LEGACY = createSelector(
  selectRouterState,
  selectSegmentsState_LEGACY,
  (routerState, segmentState) => {
    if (routerState?.state && segmentState?.entities) {
      const {
        state: { params },
      } = routerState;
      return segmentState.entities[params.segmentId] ? segmentState.entities[params.segmentId] : undefined;
    }
  }
);

export const selectSearchKey_LEGACY = createSelector(selectSegmentsState_LEGACY, (state) => state.searchKey);

export const selectSearchString_LEGACY = createSelector(selectSegmentsState_LEGACY, (state) => state.searchString);

export const selectSortKey_LEGACY = createSelector(selectSegmentsState_LEGACY, (state) => state.sortKey);

export const selectSortAs_LEGACY = createSelector(selectSegmentsState_LEGACY, (state) => state.sortAs);

export const selectPrivateSegmentListTypeOptions_LEGACY = createSelector(
  selectContextMetaData,
  selectSelectedFeatureFlag,
  (contextMetaData, flag) => {
    const flagAppContext = flag?.context?.[0];
    const groupTypes = contextMetaData?.contextMetadata?.[flagAppContext]?.GROUP_TYPES ?? [];
    const groupTypeSelectOptions = CommonTextHelpersService.formatGroupTypes(groupTypes as string[]);
    const listOptionTypes = [
      {
        value: LIST_OPTION_TYPE_LEGACY.SEGMENT,
        viewValue: LIST_OPTION_TYPE_LEGACY.SEGMENT,
      },
      {
        value: LIST_OPTION_TYPE_LEGACY.INDIVIDUAL,
        viewValue: LIST_OPTION_TYPE_LEGACY.INDIVIDUAL,
      },
      ...groupTypeSelectOptions,
    ];

    return listOptionTypes;
  }
);
