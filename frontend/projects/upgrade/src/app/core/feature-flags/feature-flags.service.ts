import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import {
  selectAllFeatureFlagsSortedByDate,
  selectIsAllFlagsFetched,
  selectIsLoadingFeatureFlags,
  selectHasInitialFeatureFlagsDataLoaded,
  selectIsLoadingAddFeatureFlag,
  selectActiveDetailsTabIndex,
} from './store/feature-flags.selectors';
import * as FeatureFlagsActions from './store/feature-flags.actions';
import { actionFetchContextMetaData } from '../experiments/store/experiments.actions';
import {
  FEATURE_FLAG_STATUS,
  FILTER_MODE,
  FLAG_SEARCH_KEY,
  FLAG_SORT_KEY,
  SEGMENT_TYPE,
  SORT_AS_DIRECTION,
} from 'upgrade_types';
import { FeatureFlagFormData } from '../../features/dashboard/feature-flags/modals/add-feature-flag-modal/add-feature-flag-modal.component';
import { AddFeatureFlagRequest } from './store/feature-flags.model';
import { ExperimentService } from '../experiments/experiments.service';
import { filter, map, pairwise, tap } from 'rxjs';

@Injectable()
export class FeatureFlagsService {
  constructor(private store$: Store<AppState>, private experimentService: ExperimentService) {}

  isInitialFeatureFlagsLoading$ = this.store$.pipe(select(selectHasInitialFeatureFlagsDataLoaded));
  isLoadingFeatureFlags$ = this.store$.pipe(select(selectIsLoadingFeatureFlags));
  allFeatureFlags$ = this.store$.pipe(select(selectAllFeatureFlagsSortedByDate));
  isAllFlagsFetched$ = this.store$.pipe(select(selectIsAllFlagsFetched));
  isLoadingAddFeatureFlag$ = this.store$.pipe(select(selectIsLoadingAddFeatureFlag));
  featureFlagsListLengthChange$ = this.allFeatureFlags$.pipe(
    pairwise(),
    filter(([prevEntities, currEntities]) => prevEntities.length !== currEntities.length)
  );
  activeDetailsTabIndex$ = this.store$.pipe(select(selectActiveDetailsTabIndex));
  appContexts$ = this.experimentService.contextMetaData$.pipe(
    map((contextMetaData) => {
      return Object.keys(contextMetaData?.contextMetadata ?? []);
    })
  );

  fetchFeatureFlags(fromStarting?: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlags({ fromStarting }));
  }

  fetchContextMetaData() {
    this.store$.dispatch(actionFetchContextMetaData({ isLoadingContextMetaData: true }));
  }

  addFeatureFlag(featureFlagFormData: any) {
    const addFeatureFlagRequest = this.createAddFeatureFlagRequest({
      ...featureFlagFormData,
      tags: featureFlagFormData.tags?.split(',').map((tag: string) => tag.trim()) ?? [], // this is a temp (hopfeully) hack, see comment in the Add Feature Flag Modal component, this logic should go elsewhere
    });
    this.store$.dispatch(FeatureFlagsActions.actionCreateFeatureFlag({ addFeatureFlagRequest }));
  }

  createAddFeatureFlagRequest(featureFlagFormData: FeatureFlagFormData): AddFeatureFlagRequest {
    const { name, key, description, appContext, tags } = featureFlagFormData;
    const addFeatureFlagRequest: AddFeatureFlagRequest = {
      name,
      key,
      description,
      status: FEATURE_FLAG_STATUS.DISABLED,
      context: [appContext],
      tags,
      featureFlagSegmentInclusion: {
        segment: {
          type: SEGMENT_TYPE.PRIVATE,
        },
      },
      featureFlagSegmentExclusion: {
        segment: {
          type: SEGMENT_TYPE.PRIVATE,
        },
      },
      filterMode: FILTER_MODE.INCLUDE_ALL,
    };

    return addFeatureFlagRequest;
  }

  setSearchKey(searchKey: FLAG_SEARCH_KEY) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSearchKey({ searchKey }));
  }

  setSearchString(searchString: string) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSearchString({ searchString }));
  }

  setSortKey(sortKey: FLAG_SORT_KEY) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSortKey({ sortKey }));
  }

  setSortingType(sortingType: SORT_AS_DIRECTION) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSortingType({ sortingType }));
  }

  setActiveDetailsTab(activeDetailsTabIndex: number) {
    this.store$.dispatch(FeatureFlagsActions.actionSetActiveDetailsTabIndex({ activeDetailsTabIndex }));
  }
}
