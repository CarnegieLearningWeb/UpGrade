import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as FeatureFlagsActions from './store/feature-flags.actions._LEGACY';
import {
  selectIsLoadingFeatureFlags_LEGACY,
  selectAllFeatureFlags_LEGACY,
  selectSelectedFeatureFlag_LEGACY,
  selectTotalFlags_LEGACY,
  selectSkipFlags_LEGACY,
} from './store/feature-flags.selectors._LEGACY';
import {
  FeatureFlag_LEGACY,
  UpsertFeatureFlagType_LEGACY,
  FLAG_SEARCH_SORT_KEY_LEGACY,
  SORT_AS_LEGACY,
} from './store/feature-flags.model._LEGACY';
import { filter, map, startWith } from 'rxjs/operators';
import { combineLatest, of, timer } from 'rxjs';

@Injectable()
export class FeatureFlagsService_LEGACY {
  constructor(private store$: Store<AppState>) {}

  // use of() to create a fake observable with mock data so we can test
  isLoadingMockFeatureFlags$ = timer(2000).pipe(
    map(() => false),
    startWith(true)
  );

  mockFeatureFlags$ = of(['I am a feature flag', 'I am another feature flag']);

  fetchMockFeatureFlags() {
    // do data fetch
  }

  isLoadingFeatureFlags$ = this.store$.pipe(select(selectIsLoadingFeatureFlags_LEGACY));
  selectedFeatureFlag$ = this.store$.pipe(select(selectSelectedFeatureFlag_LEGACY));
  allFeatureFlags$ = this.store$.pipe(
    select(selectAllFeatureFlags_LEGACY),
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
    select(selectAllFeatureFlags_LEGACY),
    filter((allFlags) => !!allFlags),
    map((flags) => flags.map((flag) => flag.key))
  );

  isInitialFeatureFlagsLoading() {
    return combineLatest([this.store$.pipe(select(selectIsLoadingFeatureFlags_LEGACY)), this.allFeatureFlags$]).pipe(
      map(([isLoading, experiments]) => !isLoading || !!experiments.length)
    );
  }

  isAllFlagsFetched() {
    return combineLatest([
      this.store$.pipe(select(selectSkipFlags_LEGACY)),
      this.store$.pipe(select(selectTotalFlags_LEGACY)),
    ]).pipe(map(([skipFlags, totalFlags]) => skipFlags === totalFlags));
  }

  fetchFeatureFlags(fromStarting?: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlags_LEGACY({ fromStarting }));
  }

  createNewFeatureFlag(flag: FeatureFlag_LEGACY) {
    this.store$.dispatch(
      FeatureFlagsActions.actionUpsertFeatureFlag_LEGACY({
        flag,
        actionType: UpsertFeatureFlagType_LEGACY.CREATE_NEW_FLAG,
      })
    );
  }

  updateFeatureFlagStatus(flagId: string, status: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionUpdateFlagStatus_LEGACY({ flagId, status }));
  }

  deleteFeatureFlag(flagId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionDeleteFeatureFlag_LEGACY({ flagId }));
  }

  updateFeatureFlag(flag: FeatureFlag_LEGACY) {
    this.store$.dispatch(
      FeatureFlagsActions.actionUpsertFeatureFlag_LEGACY({ flag, actionType: UpsertFeatureFlagType_LEGACY.UPDATE_FLAG })
    );
  }

  getActiveVariation(flag: FeatureFlag_LEGACY, type?: boolean) {
    const status = type === undefined ? flag.status : type;
    const existedVariation = flag.variations.filter((variation) => {
      if (variation.defaultVariation && variation.defaultVariation.includes(status)) {
        return variation;
      }
    })[0];
    return existedVariation ? existedVariation.value : '';
  }

  setSearchKey(searchKey: FLAG_SEARCH_SORT_KEY_LEGACY) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSearchKey_LEGACY({ searchKey }));
  }

  setSearchString(searchString: string) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSearchString_LEGACY({ searchString }));
  }

  setSortKey(sortKey: FLAG_SEARCH_SORT_KEY_LEGACY) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSortKey_LEGACY({ sortKey }));
  }

  setSortingType(sortingType: SORT_AS_LEGACY) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSortingType_LEGACY({ sortingType }));
  }
}
