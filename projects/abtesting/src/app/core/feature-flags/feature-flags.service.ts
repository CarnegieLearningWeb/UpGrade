import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as FeatureFlagsActions from './store/feature-flags.actions';
import { selectIsLoadingFeatureFlags, selectAllFeatureFlags, selectSelectedFeatureFlag } from './store/feature-flags.selectors';
import { FeatureFlag, UpsertFeatureFlagType } from './store/feature-flags.model';
import { filter, map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Injectable()
export class FeatureFlagsService {
  constructor(private store$: Store<AppState>) {}

  isLoadingFeatureFlags$ = this.store$.pipe(select(selectIsLoadingFeatureFlags));
  selectedFeatureFlag$ = this.store$.pipe(select(selectSelectedFeatureFlag));
  allFeatureFlags$ = this.store$.pipe(
    select(selectAllFeatureFlags),
    filter(allFlags => !!allFlags),
    map(flags =>
      flags.sort((a, b) => {
        const d1 = new Date(a.createdAt);
        const d2 = new Date(b.createdAt);
        return d1 < d2 ? 1 : d1 > d2 ? -1 : 0;
      })
    )
  );
  allFlagsKeys$ = this.store$.pipe(
    select(selectAllFeatureFlags),
    filter(allFlags => !!allFlags),
    map(flags => flags.map(flag => flag.key))
  );

  isInitialFeatureFlagsLoading() {
    return combineLatest(
      this.store$.pipe(select(selectIsLoadingFeatureFlags)),
      this.allFeatureFlags$
      ).pipe(
      map(([isLoading, experiments]) => {
        return !isLoading || experiments.length;
      })
    );
  }

  fetchAllFeatureFlags() {
    this.store$.dispatch(FeatureFlagsActions.actionFetchAllFeatureFlags());
  }

  createNewFeatureFlag(flag: FeatureFlag) {
    this.store$.dispatch(FeatureFlagsActions.actionUpsertFeatureFlag({ flag, actionType: UpsertFeatureFlagType.CREATE_NEW_FLAG }));
  }

  updateFeatureFlagStatus(flagId: string, status: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionUpdateFlagStatus({ flagId, status }));
  }

  deleteFeatureFlag(flagId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionDeleteFeatureFlag({ flagId }));
  }

  updateFeatureFlag(flag: FeatureFlag) {
    this.store$.dispatch(FeatureFlagsActions.actionUpsertFeatureFlag({ flag, actionType: UpsertFeatureFlagType.UPDATE_FLAG }));
  }

  getActiveVariation(flag: FeatureFlag, type?: boolean) {
    const status = type === undefined  ? flag.status : type;
    const existedVariation = flag.variations.filter(variation => {
      if (variation.defaultVariation && variation.defaultVariation.indexOf(status) !== -1) {
        return variation;
      }
    })[0];
    return  existedVariation ? existedVariation.value : '';
  }
}
