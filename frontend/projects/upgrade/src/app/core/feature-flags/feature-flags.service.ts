import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as FeatureFlagsActions from './store/feature-flags.actions';
import {
  selectIsLoadingFeatureFlags,
  selectAllFeatureFlags,
  selectSelectedFeatureFlag,
  selectTotalFlags,
  selectSkipFlags,
} from './store/feature-flags.selectors';
import { FeatureFlag, UpsertFeatureFlagType, FLAG_SEARCH_SORT_KEY, SORT_AS } from './store/feature-flags.model';
import { filter, map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

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
      FeatureFlagsActions.actionUpsertFeatureFlag({ flag, actionType: UpsertFeatureFlagType.CREATE_NEW_FLAG })
    );
  }

  updateFeatureFlagStatus(flagId: string, status: boolean) {
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

  getActiveVariation(flag: FeatureFlag, type?: boolean) {
    const status = type === undefined ? flag.status : type;
    const existedVariation = flag.variations.filter((variation) => {
      if (variation.defaultVariation && variation.defaultVariation.includes(status)) {
        return variation;
      }
    })[0];
    return existedVariation ? existedVariation.value : '';
  }

  setSearchKey(searchKey: FLAG_SEARCH_SORT_KEY) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSearchKey({ searchKey }));
  }

  setSearchString(searchString: string) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSearchString({ searchString }));
  }

  setSortKey(sortKey: FLAG_SEARCH_SORT_KEY) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSortKey({ sortKey }));
  }

  setSortingType(sortingType: SORT_AS) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSortingType({ sortingType }));
  }
}
