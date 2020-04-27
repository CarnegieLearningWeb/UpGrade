import { ExperimentState, Experiment, EXPERIMENT_SEARCH_KEY } from './experiments.model';
import { createReducer, on, Action } from '@ngrx/store';
import * as experimentsAction from './experiments.actions';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';

export const adapter: EntityAdapter<Experiment> = createEntityAdapter<
  Experiment
>();

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = adapter.getSelectors();

export const initialState: ExperimentState = adapter.getInitialState({
  isLoadingExperiment: false,
  skipExperiment: 0,
  totalExperiments: null,
  searchKey: EXPERIMENT_SEARCH_KEY.ALL,
  searchString: null,
  sortKey: null,
  sortAs: null,
  stats: {},
  allPartitions: null,
  allExperimentNames: null,
  context: []
});

const reducer = createReducer(
  initialState,
  on(experimentsAction.actionGetExperiments, state => ({
    ...state
  })),
  on(
    experimentsAction.actionGetExperimentsSuccess, (state, { experiments, totalExperiments }) => {
    const newState = {
      ...state,
      totalExperiments,
      skipExperiment: state.skipExperiment + experiments.length
    };
    return adapter.upsertMany(experiments, { ...newState });
  }),
  on(
    experimentsAction.actionGetExperimentsFailure,
    experimentsAction.actionGetExperimentByIdFailure,
    (state) =>
      ({ ...state, isLoadingExperiment: false })
  ),
  on(
    experimentsAction.actionUpsertExperimentSuccess,
    (state, { experiment }) => {
      return adapter.upsertOne(experiment, { ...state });
    }
  ),
  on(
    experimentsAction.actionStoreExperimentStats,
    (state, { stats }) => {
      return { ...state, stats: { ...state.stats, ...stats }, isLoadingExperiment: false };
    }
  ),
  on(
    experimentsAction.actionRemoveExperimentStat,
    (state, { experimentStatId }) => {
      delete state.stats[experimentStatId];
      const stats = state.stats;
      return { ...state, stats };
    }
  ),
  on(
    experimentsAction.actionGetExperimentById,
    (state) => ({ ...state, isLoadingExperiment: true })
  ),
  on(
    experimentsAction.actionGetExperimentByIdSuccess,
    (state, { experiment }) => {
      return adapter.upsertOne(experiment, { ...state, isLoadingExperiment: false });
    }
  ),
  on(
    experimentsAction.actionDeleteExperimentSuccess,
    (state, { experimentId }) => {
      return adapter.removeOne(experimentId, state);
    }
  ),
  on(
    experimentsAction.actionUpdateExperimentState,
    (state) => ({ ...state, isLoadingExperiment: true })
  ),
  on(
    experimentsAction.actionUpdateExperimentStateSuccess,
    (state, { experiment }) => {
      return adapter.upsertOne(experiment, { ...state, isLoadingExperiment: false });
    }
  ),
  on(
    experimentsAction.actionFetchAllPartitionSuccess,
    (state, { partitions }) => {
      return ({ ...state, allPartitions: partitions })
    }
  ),
  on(
    experimentsAction.actionSetIsLoadingExperiment,
    (state, { isLoadingExperiment }) => ({ ...state, isLoadingExperiment })
  ),
  on(
    experimentsAction.actionSetSearchKey,
    (state, { searchKey }) => ({ ...state, searchKey })
  ),
  on(
    experimentsAction.actionSetSearchString,
    (state, { searchString }) => ({ ...state, searchString })
  ),
  on(
    experimentsAction.actionSetSortKey,
    (state, { sortKey }) => ({ ...state, sortKey })
  ),
  on(
    experimentsAction.actionSetSortingType,
    (state, { sortingType }) => ({ ...state, sortAs: sortingType })
  ),
  on(
    experimentsAction.actionSetSkipExperiment,
    (state, { skipExperiment }) => ({ ...state, skipExperiment })
  ),
  on(
    experimentsAction.actionFetchAllExperimentNamesSuccess,
    (state, { allExperimentNames }) => ({ ...state, allExperimentNames })
  ),
  on(
    experimentsAction.actionFetchExperimentContextSuccess,
    (state, { context }) => ({ ...state, context })
  )
);

export function experimentsReducer(
  state: ExperimentState | undefined,
  action: Action
) {
  return reducer(state, action);
}
