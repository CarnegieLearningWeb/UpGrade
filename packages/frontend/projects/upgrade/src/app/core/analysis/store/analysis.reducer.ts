import { createReducer, Action, on } from '@ngrx/store';
import { AnalysisState, METRICS_JOIN_TEXT } from './analysis.models';
import * as AnalysisActions from './analysis.actions';

export const initialState: AnalysisState = {
  isMetricsLoading: false,
  isQueryExecuting: false,
  metrics: [],
  metricsFilter: null,
  queryResult: null,
};

const reducer = createReducer(
  initialState,
  on(
    AnalysisActions.actionFetchMetrics,
    AnalysisActions.actionDeleteMetric,
    AnalysisActions.actionUpsertMetrics,
    (state) => ({ ...state, isMetricsLoading: true })
  ),
  on(AnalysisActions.actionFetchMetricsSuccess, (state, { metrics }) => ({
    ...state,
    metrics,
    isMetricsLoading: false,
  })),
  on(
    AnalysisActions.actionFetchMetricsFailure,
    AnalysisActions.actionDeleteMetricFailure,
    AnalysisActions.actionUpsertMetricsFailure,
    (state) => ({ ...state, isMetricsLoading: false })
  ),
  on(AnalysisActions.actionDeleteMetricSuccess, (state, { metrics, key }) => {
    let filteredMetrics;
    if (key) {
      filteredMetrics = state.metrics.filter((metric) => metric.key !== key.split(METRICS_JOIN_TEXT)[0]);
    } else {
      filteredMetrics = state.metrics.map((metric) => {
        if (metric.key === metrics[0].key) {
          return metrics[0];
        }
        return metric;
      });
    }
    return { ...state, metrics: filteredMetrics, isMetricsLoading: false };
  }),
  on(AnalysisActions.actionUpsertMetricsSuccess, (state, { metrics }) => {
    const newMetrics = [];
    metrics.map((metric) => {
      const metricIndex = state.metrics.findIndex((existingMetric) => existingMetric.key === metric.key);
      if (metricIndex !== -1) {
        state.metrics[metricIndex] = metric;
      } else {
        newMetrics.push(metric);
      }
    });
    return { ...state, metrics: [...state.metrics, ...newMetrics], isMetricsLoading: false };
  }),
  on(AnalysisActions.actionSetMetricsFilterValue, (state, { filterString }) => ({
    ...state,
    metricsFilter: filterString,
  })),
  on(AnalysisActions.actionExecuteQuery, (state) => ({ ...state, isQueryExecuting: true })),
  on(AnalysisActions.actionExecuteQuerySuccess, (state, { queryResult }) => ({
    ...state,
    queryResult,
    isQueryExecuting: false,
  })),
  on(AnalysisActions.actionExecuteQueryFailure, (state) => ({ ...state, isQueryExecuting: false })),
  on(AnalysisActions.actionSetQueryResult, (state, { queryResult }) => ({ ...state, queryResult }))
);

export function analysisReducer(state: AnalysisState | undefined, action: Action): AnalysisState {
  return reducer(state, action);
}
