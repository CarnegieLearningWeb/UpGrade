import { createReducer, on } from '@ngrx/store';
import { formDataChanged,formDataReset } from './data-change-flag.actions';

export const initialState = false;

export const dataChangedReducer = createReducer(
  initialState,
  on(formDataChanged, (state) => true),
  on(formDataReset, (state) => false),
);