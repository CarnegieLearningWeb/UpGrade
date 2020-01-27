import { ExperimentState, Experiment } from './experiments.model';
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
  stats: {}
});

const reducer = createReducer(
  initialState,
  on(experimentsAction.actionGetAllExperiment, state => ({
    ...state,
    isLoadingExperiment: true
  })),
  on(experimentsAction.actionStoreExperiment, (state, { experiments }) => {
    return adapter.addMany(experiments, { ...state });
  }),
  on(
    experimentsAction.actionUpsertExperimentSuccess,
    (state, { experiment }) => {
      return adapter.upsertOne(experiment, { ...state });
    }
  ),
  on(
    experimentsAction.actionStoreExperimentStats,
    (state, { stats }) => {
      return { ...state, stats, isLoadingExperiment: false };
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
    experimentsAction.actionDeleteExperimentSuccess,
    (state, { experimentId }) => {
      return adapter.removeOne(experimentId, state);
    }
  )
);

export function experimentsReducer(
  state: ExperimentState | undefined,
  action: Action
) {
  return reducer(state, action);
}
