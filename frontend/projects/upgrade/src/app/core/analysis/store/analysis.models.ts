import { AppState } from '../../core.module';
import { IMetricUnit, ExperimentQueryPayload } from 'upgrade_types';
import type { REPEATED_MEASURE } from 'upgrade_types';

export { OPERATION_TYPES, IMetricMetaData, REPEATED_MEASURE } from 'upgrade_types';

export const METRICS_JOIN_TEXT = '@__@';

export interface MetricUnit {
  key: string;
  children: MetricUnit[];
  context?: string[];
}

export interface UpsertMetrics {
  metricUnit: IMetricUnit[];
}

export interface Query {
  name: string;
  query: ExperimentQueryPayload;
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
