import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AnalysisState, State, METRICS_JOIN_TEXT } from './analysis.models';
import { OperationPipe } from '../../../shared/pipes/operation.pipe';

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
      return state.metrics.filter(metric => metric.key.toLowerCase().includes(state.metricsFilter.toLowerCase()));
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
        let { queriesFilter } = state;
        queriesFilter = queriesFilter.toLowerCase();
        const operationPipe = new OperationPipe();
        const operationPipedValue = operationPipe.transform(query.query.operationType).toLowerCase();
        return query.metric.key.toLowerCase().split(METRICS_JOIN_TEXT).join(' ').includes(queriesFilter)
          || operationPipedValue.includes(queriesFilter)
          || query.experiment.name.toLowerCase().includes(queriesFilter);
      });
    }
  }
);

export const selectQueryResult = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.queryResult
);

