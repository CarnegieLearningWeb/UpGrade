import { createAction, props } from '@ngrx/store';
import { IQueryBuilder } from './analysis.models';

export const actionFetchAnalysis = createAction(
  '[Analysis] Fetch Analysis',
  props<{ query: IQueryBuilder }>()
);

export const actionFetchAnalysisSuccess = createAction(
  '[Analysis] Fetch Analysis Success',
  props<{ data: any }>()
);

export const actionFetchAnalysisFailure = createAction(
  '[Analysis] Fetch Analysis Failure'
);

export const actionSetData = createAction(
  '[Analysis] Set Data',
  props<{ data: any }>()
);

