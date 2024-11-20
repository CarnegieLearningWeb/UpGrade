import { FeatureFlag, ValidateFeatureFlagError } from '../../../../../core/feature-flags/store/feature-flags.model';
import { FeatureFlagsDataService } from '../../../../../core/feature-flags/feature-flags.data.service';
import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, tap } from 'rxjs';
import { IFeatureFlagFile } from 'upgrade_types';
import { switchMap } from 'rxjs';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';

type FeatureFlagState = {
  isLoading: boolean;
  isLoadingImportFeatureFlag: boolean;
  importResults: { fileName: string; error: string | null }[];
  validationErrors: ValidateFeatureFlagError[];
};

@Injectable()
export class FeatureFlagsStore extends ComponentStore<FeatureFlagState> {
  constructor(
    private featureFlagsDataService: FeatureFlagsDataService,
    private featureFlagsService: FeatureFlagsService
  ) {
    super({ isLoading: false, isLoadingImportFeatureFlag: false, importResults: [], validationErrors: [] });
  }

  // selectors
  readonly isLoading = this.selectSignal((state) => state.isLoading);
  readonly isLoadingImportFeatureFlag = this.selectSignal((state) => state.isLoadingImportFeatureFlag);
  readonly importResults = this.selectSignal((state) => state.importResults);
  readonly validationErrors = this.selectSignal((state) => state.validationErrors);

  // computed
  readonly featureFlagCount = this.selectSignal((state) => state.importResults.length);

  // Updaters
  readonly setFeatureFlags = this.updater((state, featureFlags: FeatureFlag[]) => ({
    ...state,
    featureFlags,
  }));

  readonly setLoading = this.updater((state, isLoading: boolean) => ({
    ...state,
    isLoading,
  }));

  readonly setLoadingImportFeatureFlag = this.updater((state, isLoadingImportFeatureFlag: boolean) => ({
    ...state,
    isLoadingImportFeatureFlag,
  }));

  readonly setImportResults = this.updater((state, importResults: { fileName: string; error: string | null }[]) => ({
    ...state,
    importResults,
  }));

  readonly setValidationErrors = this.updater((state, validationErrors: ValidateFeatureFlagError[]) => ({
    ...state,
    validationErrors,
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
              this.featureFlagsService.fetchFeatureFlags(true);
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

  readonly validateFeatureFlags = this.effect((featureFlagFiles$: Observable<IFeatureFlagFile[]>) => {
    return featureFlagFiles$.pipe(
      tap(() => this.setLoading(true)),
      switchMap((files) =>
        this.featureFlagsDataService.validateFeatureFlag({ files }).pipe(
          tap({
            next: (validationErrors: ValidateFeatureFlagError[]) => {
              this.setValidationErrors(validationErrors);
              this.setLoading(false);
            },
            error: (error) => {
              console.error('Error during validation:', error);
              this.setLoading(false);
            },
          })
        )
      )
    );
  });
}
