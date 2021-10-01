import { ExperimentState, Experiment, EXPERIMENT_SEARCH_KEY, EXPERIMENT_SORT_AS, EXPERIMENT_SORT_KEY } from './experiments.model';
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
  sortKey: EXPERIMENT_SORT_KEY.NAME,
  sortAs: EXPERIMENT_SORT_AS.ASCENDING,
  stats: {},
  graphInfo: null,
  graphRange: null,
  isGraphInfoLoading: false,
  allPartitions: null,
  allExperimentNames: null,
  contextMetaData: {}
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
    return adapter.upsertMany(experiments, { ...newState, isLoadingExperiment: false });
  }),
  on(
    experimentsAction.actionGetExperimentsFailure,
    experimentsAction.actionGetExperimentByIdFailure,
    experimentsAction.actionUpsertExperimentFailure,
    (state) =>
      ({ ...state, isLoadingExperiment: false })
  ),
  on(
    experimentsAction.actionUpsertExperimentSuccess,
    (state, { experiment }) => {
      return adapter.upsertOne(experiment, { ...state, isLoadingExperiment: false });
    }
  ),
  on(
    experimentsAction.actionFetchExperimentStatsSuccess,
    (state, { stats }) => {
      const newStats = {};
      stats = Object.keys(stats).map(key => {
        newStats[key] = { ...state.stats[key], ...stats[key] };
      });
      return { ...state, stats: { ...state.stats, ...newStats } };
    }
  ),
  on(
    experimentsAction.actionSetIsGraphLoading,
    (state, { isGraphInfoLoading }) => ({ ...state, isGraphInfoLoading })
  ),
  on(
    experimentsAction.actionFetchExperimentGraphInfoSuccess,
    (state, { graphInfo, range }) => {
      return { ...state, graphInfo: { ...state.graphInfo, [range]: graphInfo }, isGraphInfoLoading: false };
    }
  ),
  on(
    experimentsAction.actionSetExperimentGraphInfo,
    (state, { graphInfo }) => {
      return { ...state, graphInfo };
    }
  ),
  on(
    experimentsAction.actionSetGraphRange,
    (state, { range }) => {
      return { ...state, graphRange: range };
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
    experimentsAction.actionUpsertExperiment,
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
    experimentsAction.actionFetchContextMetaDataSuccess,
    (state, { contextMetaData }) => ({ ...state, contextMetaData })
  ),
  on(
    experimentsAction.actionFetchExperimentDetailStatSuccess,
    (state, { stat }) => {
      state.stats[stat.id] = stat;
      const updatedStat = state.stats[stat.id];
      return { ...state, updatedStat };
    }
  )
);

export function experimentsReducer(
  state: ExperimentState | undefined,
  action: Action
) {
  return reducer(state, action);
}
