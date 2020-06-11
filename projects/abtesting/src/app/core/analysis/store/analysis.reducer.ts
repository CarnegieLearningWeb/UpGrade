import { createReducer, Action, on } from '@ngrx/store';
import { AnalysisState } from './analysis.models';
import * as AnalysisActions from './analysis.actions';

export const initialState: AnalysisState = {
  isMetricsLoading: false,
  isQueriesLoading: false,
  isQueryExecuting: false,
  metrics: [],
  metricsFilter: null,
  queries: [],
  queriesFilter: null,
  queryResult: null
};

// TODO: Analysis query
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
    AnalysisActions.actionFetchQueries,
    AnalysisActions.actionDeleteQuery,
    (state) => ({ ...state, isQueriesLoading: true })
  ),
  on(
    AnalysisActions.actionFetchQueriesSuccess,
    (state, { queries }) => ({ ...state, queries, isQueriesLoading: false })
  ),
  on(
    AnalysisActions.actionFetchQueriesFailure,
    AnalysisActions.actionDeleteQueryFailure,
    (state) => ({ ...state, isQueriesLoading: false })
  ),
  on(
    AnalysisActions.actionSetMetricsFilterValue,
    (state, { filterString }) => ({ ...state, metricsFilter: filterString })
  ),
  on(
    AnalysisActions.actionSetQueriesFilterValue,
    (state, { filterString }) => ({ ...state, queriesFilter: filterString })
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
    AnalysisActions.actionSaveQuerySuccess,
    (state, { query }) => ({ ...state, queries: [ ...state.queries, query ] })
  ),
  on(
    AnalysisActions.actionDeleteQuerySuccess,
    (state, { query }) => {
      state.queries = state.queries.filter(data => data.id !== query.id);
      return ({ ...state, queries: state.queries, isQueriesLoading: false });
    }
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
