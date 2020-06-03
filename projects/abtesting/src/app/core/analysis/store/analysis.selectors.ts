import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AnalysisState, State } from './analysis.models';

export const selectAnalysisState = createFeatureSelector<
State,
AnalysisState
>('analysis');

export const selectIsAnalysisLoading = createSelector(
  selectAnalysisState,
  (state: AnalysisState) => state.isAnalysisLoading
);


