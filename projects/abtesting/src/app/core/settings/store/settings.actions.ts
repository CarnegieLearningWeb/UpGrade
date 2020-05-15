import { createAction, props } from '@ngrx/store';

import { ThemeOptions } from './settings.model';

export const actionChangeTheme = createAction(
  '[Settings] Change Theme',
  props<{ theme: ThemeOptions }>()
);

export const actionGetToCheckAuth = createAction(
  '[Settings] Get To Check Auth',
);

export const actionGetToCheckAuthSuccess = createAction(
  '[Settings] Get To Check Auth Success',
  props<{ toCheckAuth: boolean }>()
);

export const actionGetToCheckAuthFailure = createAction(
  '[Settings] Get To Check Auth Failure',
);

export const actionSetToCheckAuth = createAction(
  '[Settings] Set To Check Auth',
  props<{ toCheckAuth: boolean }>()
);

export const actionSetToCheckAuthSuccess = createAction(
  '[Settings] Set To Check Auth Success',
  props<{ toCheckAuth: boolean }>()
);

export const actionSetToCheckAuthFailure = createAction(
  '[Settings] Set To Check Auth Failure',
);
