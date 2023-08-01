import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AnalysisState, State } from './analysis.models';

export const selectAnalysisState = createFeatureSelector<AnalysisState>('analysis');

export const selectIsMetricsLoading = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.isMetricsLoading
);

export const selectIsQueryExecuting = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.isQueryExecuting
);

export const selectMetrics = createSelector(selectAnalysisState, (state: AnalysisState) => {
  if (!state.metricsFilter) {
    return state.metrics;
  } else {
    return state.metrics.filter((metric) => metric.key.toLowerCase().includes(state.metricsFilter.toLowerCase()));
  }
});

export const selectQueryResult = createSelector(selectAnalysisState, (state: AnalysisState) => state.queryResult);

export const selectQueryResultById = createSelector(selectAnalysisState, (state: AnalysisState, { queryId }) => {
  if (state.queryResult) {
    const queryResult = state.queryResult.filter((res) => res.id === queryId);
    return (queryResult.length && queryResult[0].result) || [];
  }
  return [];
});
