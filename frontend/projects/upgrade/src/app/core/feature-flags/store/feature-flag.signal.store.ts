import { FeatureFlag } from './feature-flags.model';
import { FeatureFlagsDataService } from '../feature-flags.data.service';
import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, tap } from 'rxjs';
import { IFeatureFlagFile } from 'upgrade_types';
import { switchMap } from 'rxjs';

type FeatureFlagState = {
  featureFlags: FeatureFlag[];
  isLoading: boolean;
  importResults: { fileName: string; error: string | null }[];
};

@Injectable()
export class FeatureFlagsStore extends ComponentStore<FeatureFlagState> {
  constructor(private featureFlagsDataService: FeatureFlagsDataService) {
    super({ featureFlags: [], isLoading: false, importResults: [] });
  }

  // selectors
  readonly featureFlags = this.selectSignal((state) => state.featureFlags);
  readonly isLoading = this.selectSignal((state) => state.isLoading);
  readonly importResults = this.selectSignal((state) => state.importResults);

  // computed
  readonly featureFlagCount = this.selectSignal((state) => state.featureFlags.length);

  // Updaters
  readonly setFeatureFlags = this.updater((state, featureFlags: FeatureFlag[]) => ({
    ...state,
    featureFlags,
  }));

  readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading,
  }));

  readonly setImportResults = this.updater((state, importResults: { fileName: string; error: string | null }[]) => ({
    ...state,
    importResults,
  }));

  // effects

  // Effect for Import Feature Flags
  readonly importFeatureFlags = this.effect((featureFlagFiles$: Observable<{ files: IFeatureFlagFile[] }>) => {
    return featureFlagFiles$.pipe(
      tap(() => this.setLoading(true)),
      switchMap((featureFlagFiles) =>
        this.featureFlagsDataService.importFeatureFlag(featureFlagFiles).pipe(
          tap({
            next: (importResults: { fileName: string; error: string | null }[]) => {
              this.setImportResults(importResults);
              this.setLoading(false);
            },
            error: (error) => {
              console.log('Error importing feature flags', error);
              // this.setError(error.message || 'An error occurred');
              this.setLoading(false);
            },
          })
        )
      )
    );
  });
}
