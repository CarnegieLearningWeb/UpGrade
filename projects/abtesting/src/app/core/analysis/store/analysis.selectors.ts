import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AnalysisState, State } from './analysis.models';

export const selectAnalysisState = createFeatureSelector<
State,
AnalysisState
>('analysis');

export const selectIsMetricsLoading = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.isMetricsLoading
);

export const selectIsQueriesLoading = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.isQueriesLoading
);

export const selectIsQueryExecuting = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.isQueryExecuting
);

export const selectMetrics = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => {
    if (!state.metricsFilter) {
      return state.metrics;
    } else {
      return state.metrics.filter(metric => metric.key.includes(state.metricsFilter));
    }
  }
);

export const selectQueries = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => {
    if (!state.queriesFilter) {
      return state.queries;
    } else {
      return state.queries.filter(query => {
        return query.metric.key.split('@__@').join(' ').includes(state.queriesFilter)
      });
    }
  }
);

export const selectQueryResult = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.queryResult
);

