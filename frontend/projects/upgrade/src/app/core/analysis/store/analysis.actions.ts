import { createAction, props } from '@ngrx/store';
import { MetricUnit, UpsertMetrics } from './analysis.models';

export const actionFetchMetrics = createAction('[Analysis] Fetch Metrics');

export const actionFetchMetricsSuccess = createAction(
  '[Analysis] Fetch Metrics Success',
  props<{ metrics: MetricUnit[] }>()
);

export const actionFetchMetricsFailure = createAction('[Analysis] Fetch Metrics Failure');

export const actionSetMetricsFilterValue = createAction(
  '[Analysis] Set Metrics Filter Value',
  props<{ filterString: string }>()
);

export const actionDeleteMetric = createAction('[Analysis] Delete Metric', props<{ key: string }>());

export const actionDeleteMetricSuccess = createAction(
  '[Analysis] Delete Metric Success',
  props<{ metrics: MetricUnit[]; key?: string }>()
);

export const actionDeleteMetricFailure = createAction('[Analysis] Delete Metric Failure');

export const actionUpsertMetrics = createAction('[Analysis] Upsert Metrics ', props<{ metrics: UpsertMetrics }>());

export const actionUpsertMetricsSuccess = createAction(
  '[Analysis] Upsert Metrics Success',
  props<{ metrics: any[] }>()
);

export const actionUpsertMetricsFailure = createAction('[Analysis] Upsert Metrics Failure');

export const actionExecuteQuery = createAction('[Analysis] Execute Query', props<{ queryIds: string[] }>());

export const actionExecuteQuerySuccess = createAction(
  '[Analysis] Execute Query Success',
  props<{ queryResult: any }>()
);

export const actionExecuteQueryFailure = createAction('[Analysis] Execute Query Failure');

export const actionSetQueryResult = createAction('[Analysis] Set Query Result', props<{ queryResult: any }>());
