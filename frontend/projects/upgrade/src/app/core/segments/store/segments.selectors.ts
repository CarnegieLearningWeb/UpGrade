import { createSelector, createFeatureSelector } from '@ngrx/store';
import { LIST_OPTION_TYPE, SegmentState } from './segments.model';
import { selectAll } from './segments.reducer';
import { selectRouterState } from '../../core.state';
import { CommonTextHelpersService } from '../../../shared/services/common-text-helpers.service';
import { selectContextMetaData } from '../../experiments/store/experiments.selectors';
import { selectSelectedFeatureFlag } from '../../feature-flags/store/feature-flags.selectors';

export const selectSegmentsState = createFeatureSelector<SegmentState>('segments');

export const selectAllSegments = createSelector(selectSegmentsState, selectAll);

export const selectIsLoadingSegments = createSelector(selectSegmentsState, (state) => state.isLoadingSegments);

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

export const selectSelectedSegment = createSelector(
  selectRouterState,
  selectSegmentsState,
  (routerState, segmentState) => {
    if (routerState?.state && segmentState?.entities) {
      const {
        state: { params },
      } = routerState;
      return segmentState.entities[params.segmentId] ? segmentState.entities[params.segmentId] : undefined;
    }
  }
);

export const selectSearchKey = createSelector(selectSegmentsState, (state) => state.searchKey);

export const selectSearchString = createSelector(selectSegmentsState, (state) => state.searchString);

export const selectSortKey = createSelector(selectSegmentsState, (state) => state.sortKey);

export const selectSortAs = createSelector(selectSegmentsState, (state) => state.sortAs);

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

export const selectIsLoadingUpsertPrivateSegmentList = createSelector(
  selectSegmentsState,
  (state) => state.isLoadingUpsertPrivateSegmentList
);
