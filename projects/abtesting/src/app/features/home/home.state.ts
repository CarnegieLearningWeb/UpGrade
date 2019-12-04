import { ActionReducerMap, createFeatureSelector } from '@ngrx/store';
import { AppState } from '../../core/core.state';
import { ExperimentState } from './store/experiments/experiments.model';
import { experimentsReducer } from './store/experiments/experiments.reducer';

export const FEATURE_NAME = 'home';

export const selectHome = createFeatureSelector<State, HomeState>(FEATURE_NAME);

export const reducers: ActionReducerMap<HomeState> = {
  experiments: experimentsReducer
};

export interface HomeState {
  experiments: ExperimentState;
}

export interface State extends AppState {
  home: HomeState;
}
