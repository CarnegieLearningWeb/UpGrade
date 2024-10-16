import { createAction, props } from '@ngrx/store';
import { CsvDataItem, StratificationFactor } from './stratification-factors.model';

export const actionFetchStratificationFactors = createAction(
  '[Stratification Factors] Fetch Stratification Factors',
  props<{ isLoading: boolean }>()
);

export const actionFetchStratificationFactorsSuccess = createAction(
  '[Stratification Factors] Fetch Stratification Factors Success',
  props<{ stratificationFactors: StratificationFactor[]; isFactorAddRequestSuccess?: boolean }>()
);

export const actionFetchStratificationFactorsFailure = createAction(
  '[Stratification Factors] Fetch Stratification Factors Failure'
);

export const actionDeleteStratificationFactor = createAction(
  '[Stratification Factors] Delete Stratification Factor',
  props<{ factor: string }>()
);

export const actionDeleteStratificationFactorSuccess = createAction(
  '[Stratification Factors] Delete Stratification Factor Success',
  props<{ stratificationFactor: StratificationFactor }>()
);

export const actionDeleteStratificationFactorFailure = createAction(
  '[Stratification Factors] Delete Stratification Factor Failure'
);

export const actionImportStratificationFactor = createAction(
  '[Stratification Factors] Import Stratification Factor',
  props<{ csvData: CsvDataItem[] }>()
);

export const actionImportStratificationFactorSuccess = createAction(
  '[Stratification Factors] Import Stratification Factor Success',
  props<{ isFactorAddRequestSuccess: boolean }>()
);

export const actionImportStratificationFactorFailure = createAction(
  '[Stratification Factors] Import Stratification Factor Failure'
);

export const actionExportStratificationFactor = createAction(
  '[Stratification Factors] Export Stratification Factor',
  props<{ factor: string }>()
);

export const actionExportStratificationFactorSuccess = createAction(
  '[Stratification Factors] Export Stratification Factor Success'
);

export const actionExportStratificationFactorFailure = createAction(
  '[Stratification Factors] Export Stratification Factor Failure'
);

export const actionSetIsLoadingStratificationFactors = createAction(
  '[Segments] Set Is Loading Stratification Factors',
  props<{ isLoading: boolean }>()
);
