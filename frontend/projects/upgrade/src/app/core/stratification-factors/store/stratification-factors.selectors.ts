import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StratificationFactorsState } from './stratification-factors.model';
import { selectAll } from './stratification-factors.reducers';

export const selectStratificationFactorsState =
  createFeatureSelector<StratificationFactorsState>('stratificationFactors');

export const selectAllStratificationFactors = createSelector(selectStratificationFactorsState, selectAll);

export const selectIsStratificationFactorsLoading = createSelector(
  selectStratificationFactorsState,
  (state) => state.isLoading
);

export const selectTotalStratificationFactors = createSelector(
  selectStratificationFactorsState,
  (state) => state.totalStratificationFactors
);
