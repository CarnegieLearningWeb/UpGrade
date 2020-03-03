import { createSelector, createFeatureSelector } from '@ngrx/store';
import { selectAll } from './experiments.reducer';
import { State, ExperimentState } from './experiments.model';
import { selectRouterState } from '../../core.state';

export const selectExperimentState = createFeatureSelector<
  State,
  ExperimentState
>('experiments');

export const selectAllExperimentFromState = createSelector(
  selectExperimentState,
  selectAll
);

export const selectAllExperiment = createSelector(
  selectExperimentState,
  selectAllExperimentFromState,
  (experimentState, allExperiments) =>  allExperiments.map(experiment =>
      ({ ...experiment, stat: experimentState.stats[experiment.id] })
    )
);

export const selectIsLoadingExperiment = createSelector(
  selectExperimentState,
  state => state.isLoadingExperiment
);

export const selectSelectedExperiment = createSelector(
  selectRouterState,
  selectExperimentState,
  ({ state: { params } }, experimentState) => {
    return experimentState.stats[params.experimentId]
      ? ({ ...experimentState.entities[params.experimentId], stat: experimentState.stats[params.experimentId] })
      : undefined;
  }
);

export const selectExperimentStats = createSelector(
  selectExperimentState,
  (state) => state.stats
);

export const selectAllPartitions = createSelector(
  selectExperimentState,
  (state) => state.allPartitions
);

export const selectAllUniqueIdentifiers = createSelector(
  selectExperimentState,
  (state) => state.uniqueIdentifiers
);
