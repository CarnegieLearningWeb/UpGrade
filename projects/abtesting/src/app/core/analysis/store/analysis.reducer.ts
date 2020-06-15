import { createReducer, Action, on } from '@ngrx/store';
import { AnalysisState } from './analysis.models';
import * as AnalysisActions from './analysis.actions';

export const initialState: AnalysisState = {
  isMetricsLoading: false,
  isQueryExecuting: false,
  metrics: [],
  metricsFilter: null,
  queryResult: null
};

const reducer = createReducer(
  initialState,
  on(
    AnalysisActions.actionFetchMetrics,
    (state) => ({ ...state, isMetricsLoading: true })
  ),
  on(
    AnalysisActions.actionFetchMetricsSuccess,
    (state, { metrics }) => ({ ...state, metrics, isMetricsLoading: false })
  ),
  on(
    AnalysisActions.actionFetchMetricsFailure,
    (state) => ({ ...state, isMetricsLoading: false })
  ),
  on(
    AnalysisActions.actionSetMetricsFilterValue,
    (state, { filterString }) => ({ ...state, metricsFilter: filterString })
  ),
  on(
    AnalysisActions.actionExecuteQuery,
    (state) => ({ ...state, isQueryExecuting: true })
  ),
  on(
    AnalysisActions.actionExecuteQuerySuccess,
    (state, { queryResult }) => ({ ...state, queryResult, isQueryExecuting: false })
  ),
  on(
    AnalysisActions.actionExecuteQueryFailure,
    (state) => ({ ...state, isQueryExecuting: false })
  ),
  on(
    AnalysisActions.actionSetQueryResult,
    (state, { queryResult }) => ({ ...state, queryResult })
  ),
);

export function analysisReducer(
  state: AnalysisState | undefined,
  action: Action
): AnalysisState {
  return reducer(state, action);
}
