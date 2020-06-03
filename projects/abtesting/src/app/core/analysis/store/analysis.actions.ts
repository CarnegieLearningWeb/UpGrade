import { createAction, props } from '@ngrx/store';

export const actionSetIsAnalysisLoading = createAction(
  '[Analysis] Set Is Analysis Loading',
  props<{ isAnalysisLoading: boolean }>()
);
