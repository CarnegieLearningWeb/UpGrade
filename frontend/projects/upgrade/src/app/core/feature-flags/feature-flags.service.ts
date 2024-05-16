import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import {
  selectAllFeatureFlags,
  selectIsLoadingFeatureFlags,
  selectSelectedFeatureFlag,
  selectSkipFlags,
  selectTotalFlags,
} from './store/feature-flags.selectors';
import * as FeatureFlagsActions from './store/feature-flags.actions';
import { combineLatest, filter, map } from 'rxjs';
import { FEATURE_FLAG_STATUS, FLAG_SORT_KEY, FLAG_SEARCH_KEY, SORT_AS_DIRECTION } from 'upgrade_types';
import { FeatureFlag, UpsertFeatureFlagType } from './store/feature-flags.model';

@Injectable()
export class FeatureFlagsService {
  constructor(private store$: Store<AppState>) {}

  isLoadingFeatureFlags$ = this.store$.pipe(select(selectIsLoadingFeatureFlags));
  selectedFeatureFlag$ = this.store$.pipe(select(selectSelectedFeatureFlag));
  allFeatureFlags$ = this.store$.pipe(
    select(selectAllFeatureFlags),
    filter((allFlags) => !!allFlags),
    map((flags) =>
      flags.sort((a, b) => {
        const d1 = new Date(a.createdAt);
        const d2 = new Date(b.createdAt);
        return d1 < d2 ? 1 : d1 > d2 ? -1 : 0;
      })
    )
  );
  allFlagsKeys$ = this.store$.pipe(
    select(selectAllFeatureFlags),
    filter((allFlags) => !!allFlags),
    map((flags) => flags.map((flag) => flag.key))
  );

  isInitialFeatureFlagsLoading() {
    return combineLatest([this.store$.pipe(select(selectIsLoadingFeatureFlags)), this.allFeatureFlags$]).pipe(
      map(([isLoading, experiments]) => !isLoading || !!experiments.length)
    );
  }

  isAllFlagsFetched() {
    return combineLatest([this.store$.pipe(select(selectSkipFlags)), this.store$.pipe(select(selectTotalFlags))]).pipe(
      map(([skipFlags, totalFlags]) => skipFlags === totalFlags)
    );
  }

  fetchFeatureFlags(fromStarting?: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlags({ fromStarting }));
  }

  createNewFeatureFlag(flag: FeatureFlag) {
    this.store$.dispatch(
      FeatureFlagsActions.actionUpsertFeatureFlag({
        flag,
        actionType: UpsertFeatureFlagType.CREATE_NEW_FLAG,
      })
    );
  }

  updateFeatureFlagStatus(flagId: string, status: FEATURE_FLAG_STATUS) {
    this.store$.dispatch(FeatureFlagsActions.actionUpdateFlagStatus({ flagId, status }));
  }

  deleteFeatureFlag(flagId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionDeleteFeatureFlag({ flagId }));
  }

  updateFeatureFlag(flag: FeatureFlag) {
    this.store$.dispatch(
      FeatureFlagsActions.actionUpsertFeatureFlag({ flag, actionType: UpsertFeatureFlagType.UPDATE_FLAG })
    );
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
}
