import { createSelector, createFeatureSelector } from '@ngrx/store';
import { selectAll } from './experiments.reducer';
import { State, ExperimentState } from './experiments.model';
import { selectRouterState } from '../../core.state';

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

export const selectSelectedExperiment = createSelector(
  selectRouterState,
  selectExperimentState,
  ({ state: { params } }, experimentState) => experimentState.entities[params.experimentId]
);
