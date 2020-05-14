import { createAction, props } from '@ngrx/store';

import { Language, ThemeOptions } from './settings.model';

export const actionSettingsChangeLanguage = createAction(
  '[Settings] Change Language',
  props<{ language: Language }>()
);

export const actionSettingsChangeTheme = createAction(
  '[Settings] Change Theme',
  props<{ theme: ThemeOptions }>()
);
export const actionSettingsChangeAutoNightMode = createAction(
  '[Settings] Change Auto Night Mode',
  props<{ autoNightMode: boolean }>()
);

export const actionSettingsChangeStickyHeader = createAction(
  '[Settings] Change Sticky Header',
  props<{ stickyHeader: boolean }>()
);

export const actionSettingsChangeAnimationsPage = createAction(
  '[Settings] Change Animations Page',
  props<{ pageAnimations: boolean }>()
);

export const actionSettingsChangeAnimationsPageDisabled = createAction(
  '[Settings] Change Animations Page Disabled',
  props<{ pageAnimationsDisabled: boolean }>()
);

export const actionSettingsChangeAnimationsElements = createAction(
  '[Settings] Change Animations Elements',
  props<{ elementsAnimations: boolean }>()
);
export const actionSettingsChangeHour = createAction(
  '[Settings] Change Hours',
  props<{ hour: number }>()
);

// TODO: Define proper place for this
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
