import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State, FeatureFlagState } from './feature-flags.model';
import { selectAll } from './feature-flags.reducer';
import { selectRouterState } from '../../core.state';

export const selectFeatureFlagsState = createFeatureSelector<
  State,
  FeatureFlagState
>('featureFlags');

export const selectAllFeatureFlags = createSelector(
  selectFeatureFlagsState,
  selectAll
);

export const selectIsLoadingFeatureFlags = createSelector(
  selectFeatureFlagsState,
  (state) => state.isLoadingFeatureFlags
);

export const selectSelectedFeatureFlag = createSelector(
  selectRouterState,
  selectFeatureFlagsState,
  ({ state: { params } }, featureFlagState) => {
    return featureFlagState.entities[params.flagId]
      ? featureFlagState.entities[params.flagId]
      : undefined;
  }
);
