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
  selectIsLoadingImportFeatureFlag,
  selectFeatureFlagIds,
  selectShouldShowWarningForSelectedFlag,
  selectWarningStatusForAllFlags,
  selectDuplicateKeyFound,
} from './store/feature-flags.selectors';
import * as FeatureFlagsActions from './store/feature-flags.actions';
import { actionFetchContextMetaData } from '../experiments/store/experiments.actions';
import { FLAG_SEARCH_KEY, FLAG_SORT_KEY, SORT_AS_DIRECTION } from 'upgrade_types';
import {
  AddFeatureFlagRequest,
  UpdateFeatureFlagRequest,
  UpdateFilterModeRequest,
  UpdateFeatureFlagStatusRequest,
  FeatureFlagLocalStorageKeys,
} from './store/feature-flags.model';
import { filter, map, pairwise } from 'rxjs';
import isEqual from 'lodash.isequal';
import { selectCurrentUserEmail } from '../auth/store/auth.selectors';
import { AddPrivateSegmentListRequest, EditPrivateSegmentListRequest } from '../segments/store/segments.model';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable()
export class FeatureFlagsService {
  constructor(private store$: Store<AppState>, private localStorageService: LocalStorageService) {}

  currentUserEmailAddress$ = this.store$.pipe(select(selectCurrentUserEmail));
  allFeatureFlagsIds$ = this.store$.pipe(select(selectFeatureFlagIds));
  isInitialFeatureFlagsLoading$ = this.store$.pipe(select(selectHasInitialFeatureFlagsDataLoaded));
  isLoadingFeatureFlags$ = this.store$.pipe(select(selectIsLoadingFeatureFlags));
  isLoadingSelectedFeatureFlag$ = this.store$.pipe(select(selectIsLoadingSelectedFeatureFlag));
  isLoadingUpsertFeatureFlag$ = this.store$.pipe(select(selectIsLoadingUpsertFeatureFlag));
  isDuplicateKeyFound$ = this.store$.pipe(select(selectDuplicateKeyFound));
  isLoadingFeatureFlagDelete$ = this.store$.pipe(select(selectIsLoadingFeatureFlagDelete));
  isLoadingImportFeatureFlag$ = this.store$.pipe(select(selectIsLoadingImportFeatureFlag));
  isLoadingUpdateFeatureFlagStatus$ = this.store$.pipe(select(selectIsLoadingUpdateFeatureFlagStatus));
  isLoadingUpsertPrivateSegmentList$ = this.store$.pipe(select(selectIsLoadingUpsertFeatureFlag));
  allFeatureFlags$ = this.store$.pipe(select(selectAllFeatureFlagsSortedByDate));
  appContexts$ = this.store$.pipe(select(selectAppContexts));
  isAllFlagsFetched$ = this.store$.pipe(select(selectIsAllFlagsFetched));
  searchString$ = this.store$.pipe(select(selectSearchString));
  searchKey$ = this.store$.pipe(select(selectSearchKey));
  sortKey$ = this.store$.pipe(select(selectSortKey));
  sortAs$ = this.store$.pipe(select(selectSortAs));
  shouldShowWarningForSelectedFlag$ = this.store$.pipe(select(selectShouldShowWarningForSelectedFlag));
  warningStatusForAllFlags$ = this.store$.pipe(select(selectWarningStatusForAllFlags));

  hasFeatureFlagsCountChanged$ = this.allFeatureFlags$.pipe(
    pairwise(),
    filter(([prevEntities, currEntities]) => prevEntities.length !== currEntities.length)
  );

  selectedFeatureFlagStatusChange$ = this.store$.pipe(
    select(selectSelectedFeatureFlag),
    pairwise(),
    filter(([prev, curr]) => prev.status !== curr.status)
  );
  selectedFeatureFlagFilterModeChange$ = this.store$.pipe(
    select(selectSelectedFeatureFlag),
    pairwise(),
    filter(([prev, curr]) => prev.filterMode !== curr.filterMode)
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

  updateFilterMode(updateFilterModeRequest: UpdateFilterModeRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionUpdateFilterMode({ updateFilterModeRequest }));
  }

  setIsDuplicateKey(duplicateKeyFound: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionSetIsDuplicateKey({ duplicateKeyFound }));
  }

  deleteFeatureFlag(flagId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionDeleteFeatureFlag({ flagId }));
  }

  setIsLoadingImportFeatureFlag(isLoadingImportFeatureFlag: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionSetIsLoadingImportFeatureFlag({ isLoadingImportFeatureFlag }));
  }

  emailFeatureFlagData(featureFlagId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionEmailFeatureFlagData({ featureFlagId }));
  }

  exportFeatureFlagsData(featureFlagId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionExportFeatureFlagDesign({ featureFlagId }));
  }

  setSearchKey(searchKey: FLAG_SEARCH_KEY) {
    this.localStorageService.setItem(FeatureFlagLocalStorageKeys.FEATURE_FLAG_SEARCH_KEY, searchKey);
    this.store$.dispatch(FeatureFlagsActions.actionSetSearchKey({ searchKey }));
  }

  setSearchString(searchString: string) {
    this.localStorageService.setItem(FeatureFlagLocalStorageKeys.FEATURE_FLAG_SEARCH_STRING, searchString);
    this.store$.dispatch(FeatureFlagsActions.actionSetSearchString({ searchString }));
  }

  setSortKey(sortKey: FLAG_SORT_KEY) {
    this.localStorageService.setItem(FeatureFlagLocalStorageKeys.FEATURE_FLAG_SORT_KEY, sortKey);
    this.store$.dispatch(FeatureFlagsActions.actionSetSortKey({ sortKey }));
  }

  setSortingType(sortingType: SORT_AS_DIRECTION) {
    this.localStorageService.setItem(FeatureFlagLocalStorageKeys.FEATURE_FLAG_SORT_TYPE, sortingType);
    this.store$.dispatch(FeatureFlagsActions.actionSetSortingType({ sortingType }));
  }

  setActiveDetailsTab(activeDetailsTabIndex: number) {
    this.store$.dispatch(FeatureFlagsActions.actionSetActiveDetailsTabIndex({ activeDetailsTabIndex }));
  }

  addFeatureFlagInclusionPrivateSegmentList(list: AddPrivateSegmentListRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionAddFeatureFlagInclusionList({ list }));
  }

  updateFeatureFlagInclusionPrivateSegmentList(list: EditPrivateSegmentListRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionUpdateFeatureFlagInclusionList({ list }));
  }

  deleteFeatureFlagInclusionPrivateSegmentList(segmentId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionDeleteFeatureFlagInclusionList({ segmentId }));
  }

  addFeatureFlagExclusionPrivateSegmentList(list: AddPrivateSegmentListRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionAddFeatureFlagExclusionList({ list }));
  }

  updateFeatureFlagExclusionPrivateSegmentList(list: EditPrivateSegmentListRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionUpdateFeatureFlagExclusionList({ list }));
  }

  deleteFeatureFlagExclusionPrivateSegmentList(segmentId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionDeleteFeatureFlagExclusionList({ segmentId }));
  }
}