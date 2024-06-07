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
  selectIsLoadingUpdateFeatureFlagStatus,
} from './store/feature-flags.selectors';
import * as FeatureFlagsActions from './store/feature-flags.actions';
import { actionFetchContextMetaData } from '../experiments/store/experiments.actions';
import { FLAG_SEARCH_KEY, FLAG_SORT_KEY, SORT_AS_DIRECTION } from 'upgrade_types';
import { AddFeatureFlagRequest, UpdateFeatureFlagStatusRequest } from './store/feature-flags.model';
import { ExperimentService } from '../experiments/experiments.service';
import { filter, map, pairwise } from 'rxjs';

@Injectable()
export class FeatureFlagsService {
  constructor(private store$: Store<AppState>, private experimentService: ExperimentService) {}

  isInitialFeatureFlagsLoading$ = this.store$.pipe(select(selectHasInitialFeatureFlagsDataLoaded));
  isLoadingFeatureFlags$ = this.store$.pipe(select(selectIsLoadingFeatureFlags));
  isLoadingUpdateFeatureFlagStatus$ = this.store$.pipe(select(selectIsLoadingUpdateFeatureFlagStatus));
  allFeatureFlags$ = this.store$.pipe(select(selectAllFeatureFlagsSortedByDate));
  isAllFlagsFetched$ = this.store$.pipe(select(selectIsAllFlagsFetched));
  isLoadingAddFeatureFlag$ = this.store$.pipe(select(selectIsLoadingAddFeatureFlag));
  featureFlagsListLengthChange$ = this.allFeatureFlags$.pipe(
    pairwise(),
    filter(([prevEntities, currEntities]) => prevEntities.length !== currEntities.length)
  );
  // featureFlagStatusChanged$ = this.store$.pipe(select());
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

  addFeatureFlag(addFeatureFlagRequest: AddFeatureFlagRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionAddFeatureFlag({ addFeatureFlagRequest }));
  }

  enableFeatureFlag(updateFeatureFlagStatusRequest: UpdateFeatureFlagStatusRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionEnableFeatureFlag({ updateFeatureFlagStatusRequest }));
  }

  disableFeatureFlag(updateFeatureFlagStatusRequest: UpdateFeatureFlagStatusRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionDisableFeatureFlag({ updateFeatureFlagStatusRequest }));
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
