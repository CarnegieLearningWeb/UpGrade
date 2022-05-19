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

export const selectIsLoadingExperimentDetailStats = createSelector(
  selectExperimentState,
  state => state.isLoadingExperimentDetailStats
);

export const selectSelectedExperiment = createSelector(
  selectRouterState,
  selectExperimentState,
  ({ state: { params } }, experimentState) => {
    return experimentState.stats[params.experimentId]
      ? ({ ...experimentState.entities[params.experimentId], stat: experimentState.stats[params.experimentId] })
      : ({ ...experimentState.entities[params.experimentId], stat: null });
  }
);

export const selectExperimentById = createSelector(
  selectExperimentState,
  (state, { experimentId }) => state.entities[experimentId]
);

export const selectExperimentStats = createSelector(
  selectExperimentState,
  (state) => state.stats
);

export const selectAllPartitions = createSelector(
  selectExperimentState,
  (state) => state.allPartitions
);

export const selectSkipExperiment = createSelector(
  selectExperimentState,
  (state) => state.skipExperiment
);

export const selectTotalExperiment = createSelector(
  selectExperimentState,
  (state) => state.totalExperiments
);

export const selectSearchKey = createSelector(
  selectExperimentState,
  (state) => state.searchKey
);

export const selectSearchString = createSelector(
  selectExperimentState,
  (state) => state.searchString
);

export const selectSortKey = createSelector(
  selectExperimentState,
  (state) => state.sortKey
);

export const selectSortAs = createSelector(
  selectExperimentState,
  (state) => state.sortAs
);

export const selectAllExperimentNames = createSelector(
  selectExperimentState,
  (state) => state.allExperimentNames
);

export const selectIsGraphLoading = createSelector(
  selectExperimentState,
  (state) => state.isGraphInfoLoading
)

export const selectExperimentGraphRange = createSelector(
  selectExperimentState,
  (state) => state.graphRange
);

export const selectExperimentGraphInfo = createSelector(
  selectExperimentState,
  selectExperimentGraphRange,
  (state, range) => {
      if (state.graphInfo && range) {
        return state.graphInfo[range];
      }
      return null;
  }
);

export const selectExperimentStatById = createSelector(
  selectExperimentState,
  (state, { experimentId }) => {
    return state.stats[experimentId];
  }
);

export const selectContextMetaData = createSelector(
  selectExperimentState,
  (state) => state.contextMetaData
);
