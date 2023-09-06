import { createAction, props } from '@ngrx/store';
import { StratificationFactors } from './stratification-factors.model';

export const actionFetchStratificationFactors = createAction(
  '[Stratification Factors] Fetch Stratification Factors',
  props<{ fromStarting?: boolean }>
);

export const actionFetchStratificationFactorsSuccess = createAction(
  '[Stratification Factors] Fetch Stratification Factors Success',
  props<{ stratificationFactors: StratificationFactors[] }>()
);

export const actionFetchStratificationFactorsFailure = createAction(
  '[Stratification Factors] Fetch Stratification Factors Failure'
);
