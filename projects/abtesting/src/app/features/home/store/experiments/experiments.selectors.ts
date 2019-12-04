import { createSelector } from '@ngrx/store';
import { HomeState, selectHome } from '../../home.state';
import { selectAll } from './experiments.reducer';

export const selectExperimentState = createSelector(
  selectHome,
  (state: HomeState) => state.experiments
);

export const selectAllExperiment = createSelector(
  selectExperimentState,
  selectAll
);
