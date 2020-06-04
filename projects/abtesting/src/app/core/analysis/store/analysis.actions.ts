import { createAction, props } from '@ngrx/store';
import { MetricUnit } from './analysis.models';

export const actionFetchMetrics = createAction(
  '[Analysis] Fetch Metrics'
);

export const actionFetchMetricsSuccess = createAction(
  '[Analysis] Fetch Metrics Success',
  props<{ metrics: MetricUnit[] }>()
);

export const actionFetchMetricsFailure = createAction(
  '[Analysis] Fetch Metrics Failure',
);

export const actionSetMetricsFilterValue = createAction(
  '[Analysis] Set Metrics Filter Value',
  props<{ filterString: string }>()
);

export const actionFetchQueries = createAction(
  '[Analysis] Fetch Queries'
);

export const actionFetchQueriesSuccess = createAction(
  '[Analysis] Fetch Queries Success',
  props<{ queries: any[] }>()
);

export const actionFetchQueriesFailure = createAction(
  '[Analysis] Fetch Queries Failure',
);

export const actionSetQueriesFilterValue = createAction(
  '[Analysis] Set Queries Filter Value',
  props<{ filterString: string }>()
);

export const actionExecuteQuery = createAction(
  '[Analysis] Execute Query',
  props<{ queryId: string }>()
);

export const actionExecuteQuerySuccess = createAction(
  '[Analysis] Execute Query Success',
  props<{ queryResult: any }>()
);

export const actionExecuteQueryFailure = createAction(
  '[Analysis] Execute Query Failure',
);

export const actionSaveQuery = createAction(
  '[Analysis] Save Query',
  props<{ query: any }>()
);

export const actionSaveQuerySuccess = createAction(
  '[Analysis] Save Query Success',
  props<{ query: any }>()
);

export const actionSaveQueryFailure = createAction(
  '[Analysis] Save Query Failure',
);

export const actionSetQueryResult = createAction(
  '[Analysis] Set Query Result',
  props<{ queryResult: any }>()
);
