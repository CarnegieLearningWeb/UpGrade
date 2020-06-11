import { AppState } from '../../core.module';
import { OPERATION_TYPES } from 'upgrade_types';

export {
  OPERATION_TYPES
};

export const METRICS_JOIN_TEXT = '@__@';

export interface MetricUnit {
  key: string;
  children: MetricUnit[];
}

export interface Query {
  name: string;
  query: any;
  metric: {
    key: string;
  }
}

export interface AnalysisState {
  isMetricsLoading: boolean;
  isQueriesLoading: boolean;
  isQueryExecuting: boolean;
  metrics: MetricUnit[];
  metricsFilter: string;
  // TODO: Analysis query
  queries: any[];
  queriesFilter: string;
  queryResult: any;
}

export interface State extends AppState {
  analysis: AnalysisState;
}
