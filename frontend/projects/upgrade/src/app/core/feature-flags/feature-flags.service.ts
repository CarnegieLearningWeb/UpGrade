import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import {
  selectAllFeatureFlagsSortedByDate,
  selectIsAllFlagsFetched,
  selectIsLoadingFeatureFlags,
  selectHasInitialFeatureFlagsDataLoaded,
  selectSearchKey,
  selectSearchString,
  selectIsLoadingUpsertFeatureFlag,
  selectActiveDetailsTabIndex,
  selectIsLoadingUpdateFeatureFlagStatus,
  selectSelectedFeatureFlag,
  selectSearchFeatureFlagParams,
  selectRootTableState,
  selectFeatureFlagOverviewDetails,
  selectIsLoadingFeatureFlagDelete,
  selectFeatureFlagInclusions,
  selectFeatureFlagExclusions,
  selectIsLoadingSelectedFeatureFlag,
  selectSortKey,
  selectSortAs,
  selectAppContexts,
} from './store/feature-flags.selectors';
import * as FeatureFlagsActions from './store/feature-flags.actions';
import { actionFetchContextMetaData } from '../experiments/store/experiments.actions';
import { FLAG_SEARCH_KEY, FLAG_SORT_KEY, SORT_AS_DIRECTION } from 'upgrade_types';
import {
  AddFeatureFlagRequest,
  UpdateFeatureFlagRequest,
  UpdateFeatureFlagStatusRequest,
} from './store/feature-flags.model';
import { filter, map, pairwise } from 'rxjs';
import isEqual from 'lodash.isequal';
import { PrivateSegmentListRequest } from '../segments/store/segments.model';

@Injectable()
export class FeatureFlagsService {
  constructor(private store$: Store<AppState>) {}

  isInitialFeatureFlagsLoading$ = this.store$.pipe(select(selectHasInitialFeatureFlagsDataLoaded));
  isLoadingFeatureFlags$ = this.store$.pipe(select(selectIsLoadingFeatureFlags));
  isLoadingSelectedFeatureFlag$ = this.store$.pipe(select(selectIsLoadingSelectedFeatureFlag));
  isLoadingUpdateFeatureFlagStatus$ = this.store$.pipe(select(selectIsLoadingUpdateFeatureFlagStatus));
  isLoadingUpsertPrivateSegmentList$ = this.store$.pipe(select(selectIsLoadingUpsertFeatureFlag));
  allFeatureFlags$ = this.store$.pipe(select(selectAllFeatureFlagsSortedByDate));
  appContexts$ = this.store$.pipe(select(selectAppContexts));
  isAllFlagsFetched$ = this.store$.pipe(select(selectIsAllFlagsFetched));
  searchString$ = this.store$.pipe(select(selectSearchString));
  searchKey$ = this.store$.pipe(select(selectSearchKey));
  sortKey$ = this.store$.pipe(select(selectSortKey));
  sortAs$ = this.store$.pipe(select(selectSortAs));
  isLoadingUpsertFeatureFlag$ = this.store$.pipe(select(selectIsLoadingUpsertFeatureFlag));
  IsLoadingFeatureFlagDelete$ = this.store$.pipe(select(selectIsLoadingFeatureFlagDelete));

  hasFeatureFlagsCountChanged$ = this.allFeatureFlags$.pipe(
    pairwise(),
    filter(([prevEntities, currEntities]) => prevEntities.length !== currEntities.length)
  );

  selectedFeatureFlagStatusChange$ = this.store$.pipe(
    select(selectSelectedFeatureFlag),
    pairwise(),
    filter(([prev, curr]) => prev.status !== curr.status)
  );
  // Observable to check if selectedFeatureFlag is removed from the store
  isSelectedFeatureFlagRemoved$ = this.store$.pipe(
    select(selectSelectedFeatureFlag),
    pairwise(),
    filter(([prev, curr]) => prev && !curr)
  );

  isSelectedFeatureFlagUpdated$ = this.store$.pipe(
    select(selectSelectedFeatureFlag),
    pairwise(),
    filter(([prev, curr]) => {
      return prev && curr && !isEqual(prev, curr);
    }),
    map(([, curr]) => curr)
  );

  selectedFlagOverviewDetails = this.store$.pipe(select(selectFeatureFlagOverviewDetails));
  selectedFeatureFlag$ = this.store$.pipe(select(selectSelectedFeatureFlag));
  searchParams$ = this.store$.pipe(select(selectSearchFeatureFlagParams));
  selectRootTableState$ = this.store$.select(selectRootTableState);
  activeDetailsTabIndex$ = this.store$.pipe(select(selectActiveDetailsTabIndex));
  selectFeatureFlagInclusions$ = this.store$.pipe(select(selectFeatureFlagInclusions));
  selectFeatureFlagInclusionsLength$ = this.store$.pipe(
    select(selectFeatureFlagInclusions),
    map((inclusions) => inclusions.length)
  );
  selectFeatureFlagExclusions$ = this.store$.pipe(select(selectFeatureFlagExclusions));
  selectFeatureFlagExclusionsLength$ = this.store$.pipe(
    select(selectFeatureFlagExclusions),
    map((exclusions) => exclusions.length)
  );

  fetchFeatureFlags(fromStarting?: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlags({ fromStarting }));
  }

  fetchFeatureFlagById(featureFlagId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlagById({ featureFlagId }));
  }

  fetchContextMetaData() {
    this.store$.dispatch(actionFetchContextMetaData({ isLoadingContextMetaData: true }));
  }

  addFeatureFlag(addFeatureFlagRequest: AddFeatureFlagRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionAddFeatureFlag({ addFeatureFlagRequest }));
  }

  updateFeatureFlag(flag: UpdateFeatureFlagRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionUpdateFeatureFlag({ flag }));
  }

  updateFeatureFlagStatus(updateFeatureFlagStatusRequest: UpdateFeatureFlagStatusRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionUpdateFeatureFlagStatus({ updateFeatureFlagStatusRequest }));
  }

  deleteFeatureFlag(flagId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionDeleteFeatureFlag({ flagId }));
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

  addFeatureFlagInclusionPrivateSegmentList(list: PrivateSegmentListRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionAddFeatureFlagInclusionList({ list }));
  }
}
