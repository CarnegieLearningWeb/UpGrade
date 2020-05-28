import { createReducer, on, Action } from '@ngrx/store';
import * as AnalysisActions from './analysis.actions';
import { AnalysisState } from './analysis.models';

export const initialState: AnalysisState = {
  isAnalysisLoading: false,
  data: null,
};

const reducer = createReducer(
  initialState,
  on(
    AnalysisActions.actionFetchAnalysis,
    (state => ({ ...state, isAnalysisLoading: true }))
  ),
  on(
    AnalysisActions.actionFetchAnalysisSuccess,
    (state, { data }) => {
      return { ...state, data, isAnalysisLoading: false }
    }
  ),
  on(
    AnalysisActions.actionFetchAnalysisFailure,
    (state => ({ ...state, isAnalysisLoading: false }))
  ),
  on(
    AnalysisActions.actionSetData,
    (state, { data }) => ({ ...state, data })
  ),
);

export function analysisReducer(
  state: AnalysisState | undefined,
  action: Action
): AnalysisState {
  return reducer(state, action);
}
