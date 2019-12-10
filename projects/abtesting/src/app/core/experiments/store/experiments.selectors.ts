import { createSelector, createFeatureSelector } from '@ngrx/store';
import { selectAll } from './experiments.reducer';
import { State, ExperimentState } from './experiments.model';

export const selectExperimentState = createFeatureSelector<
  State,
  ExperimentState
>('experiments');

export const selectAllExperiment = createSelector(
  selectExperimentState,
  selectAll
);

export const selectIsLoadingExperiment = createSelector(
  selectExperimentState,
  state => state.isLoadingExperiment
);
