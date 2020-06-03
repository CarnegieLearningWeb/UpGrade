import { createReducer, Action } from '@ngrx/store';
import { AnalysisState } from './analysis.models';

export const initialState: AnalysisState = {
  isAnalysisLoading: false,
  data: null,
};

const reducer = createReducer(
  initialState,
);

export function analysisReducer(
  state: AnalysisState | undefined,
  action: Action
): AnalysisState {
  return reducer(state, action);
}
