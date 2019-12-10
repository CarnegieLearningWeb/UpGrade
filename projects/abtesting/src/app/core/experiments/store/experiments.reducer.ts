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
  isLoadingExperiment: false
});

const reducer = createReducer(
  initialState,
  on(experimentsAction.actionGetAllExperiment, state => ({
    ...state,
    isLoadingExperiment: true
  })),
  on(experimentsAction.actionStoreExperiment, (state, { experiments }) => {
    return adapter.addMany(experiments, { ...state, isLoadingExperiment: false });
  })
);

export function experimentsReducer(
  state: ExperimentState | undefined,
  action: Action
) {
  return reducer(state, action);
}
