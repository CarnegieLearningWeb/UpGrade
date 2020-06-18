import { createReducer, Action, on } from '@ngrx/store';
import { AnalysisState, METRICS_JOIN_TEXT } from './analysis.models';
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
    AnalysisActions.actionDeleteMetric,
    (state) => ({ ...state, isMetricsLoading: true })
  ),
  on(
    AnalysisActions.actionFetchMetricsSuccess,
    (state, { metrics }) => ({ ...state, metrics, isMetricsLoading: false })
  ),
  on(
    AnalysisActions.actionFetchMetricsFailure,
    AnalysisActions.actionDeleteMetricFailure,
    (state) => ({ ...state, isMetricsLoading: false })
  ),
  on(
    AnalysisActions.actionDeleteMetricSuccess,
    (state, { metrics, key }) => {
      let filteredMetrics;
      if (key) {
        filteredMetrics = state.metrics.filter(metric => metric.key !== key.split(METRICS_JOIN_TEXT)[0]);
      } else {
        filteredMetrics = state.metrics.map(metric => {
          if (metric.key === metrics[0].key) {
            return metrics[0];
          }
          return metric;
        });
      }
      return { ...state, metrics: filteredMetrics, isMetricsLoading: false };
    }
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
