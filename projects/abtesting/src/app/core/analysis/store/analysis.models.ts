import { AppState } from '../../core.module';
import { OPERATION_TYPES, IMetricMetaData, IMetricUnit } from 'upgrade_types';

export {
  OPERATION_TYPES,
  IMetricMetaData
};

export const METRICS_JOIN_TEXT = '@__@';

export interface MetricUnit {
  key: string;
  children: MetricUnit[];
}

export interface UpsertMetrics {
  metricUnit: IMetricUnit[];
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
  isQueryExecuting: boolean;
  metrics: MetricUnit[];
  metricsFilter: string;
  queryResult: any;
}

export interface State extends AppState {
  analysis: AnalysisState;
}
