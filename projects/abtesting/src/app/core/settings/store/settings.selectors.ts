import { createSelector, createFeatureSelector } from '@ngrx/store';

import { SettingsState, State } from './settings.model';

<<<<<<< HEAD:projects/abtesting/src/app/core/settings/store/settings.selectors.ts
export const selectSettingsState = createFeatureSelector<State, SettingsState>(
  'settings'
);
=======
export const selectSettingsState = createFeatureSelector<
  State,
  SettingsState
>('settings');
>>>>>>> ccbc0153a7b561ca000bf8e2fe6584f6f80dd372:projects/abtesting/src/app/core/settings/settings.selectors.ts

export const selectSettings = createSelector(
  selectSettingsState,
  (state: SettingsState) => state
);

export const selectSettingsStickyHeader = createSelector(
  selectSettings,
  (state: SettingsState) => state.stickyHeader
);

export const selectSettingsLanguage = createSelector(
  selectSettings,
  (state: SettingsState) => state.language
);

export const selectTheme = createSelector(
  selectSettings,
  settings => settings.theme
);

export const selectPageAnimations = createSelector(
  selectSettings,
  settings => settings.pageAnimations
);

export const selectElementsAnimations = createSelector(
  selectSettings,
  settings => settings.elementsAnimations
);

export const selectAutoNightMode = createSelector(
  selectSettings,
  settings => settings.autoNightMode
);

export const selectNightTheme = createSelector(
  selectSettings,
  settings => settings.nightTheme
);

export const selectHour = createSelector(
  selectSettings,
  settings => settings.hour
);

export const selectIsNightHour = createSelector(
  selectAutoNightMode,
  selectHour,
  (autoNightMode, hour) => autoNightMode && (hour >= 21 || hour <= 7)
);

export const selectEffectiveTheme = createSelector(
  selectTheme,
  selectNightTheme,
  selectIsNightHour,
  (theme, nightTheme, isNightHour) => (isNightHour ? nightTheme : theme)
);
