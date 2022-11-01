import { AppState } from '../../core.module';
import { OPERATION_TYPES, IMetricMetaData, IMetricUnit, REPEATED_MEASURE } from 'upgrade_types';

export { OPERATION_TYPES, IMetricMetaData, REPEATED_MEASURE };

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
  };
  repeatedMeasure: REPEATED_MEASURE;
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
