import { createAction, props } from '@ngrx/store';
import { StratificationFactor } from './stratification-factors.model';

export const actionFetchStratificationFactors = createAction(
  '[Stratification Factors] Fetch Stratification Factors',
  props<{ isLoading: boolean }>()
);

export const actionFetchStratificationFactorsSuccess = createAction(
  '[Stratification Factors] Fetch Stratification Factors Success',
  props<{ stratificationFactors: StratificationFactor[] }>()
);

export const actionFetchStratificationFactorsFailure = createAction(
  '[Stratification Factors] Fetch Stratification Factors Failure'
);

export const actionDeleteStratificationFactor = createAction(
  '[Stratification Factors] Delete Stratification Factor',
  props<{ factorId: string }>()
);

export const actionDeleteStratificationFactorSuccess = createAction(
  '[Stratification Factors] Delete Stratification Factor Success',
  props<{ stratificationFactor: StratificationFactor }>()
);

export const actionDeleteStratificationFactorFailure = createAction(
  '[Stratification Factors] Delete Stratification Factor Failure'
);

export const actionSetIsLoadingStratificationFactors = createAction(
  '[Segments] Set Is Loading Stratification Factors',
  props<{ isLoadingStratificationFactors: boolean }>()
);
