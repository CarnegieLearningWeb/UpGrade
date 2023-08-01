import { createSelector, createFeatureSelector } from '@ngrx/store';

import { SettingsState, State } from './settings.model';

export const selectSettingsState = createFeatureSelector<SettingsState>('settings');

export const selectSettings = createSelector(selectSettingsState, (state: SettingsState) => state);

export const selectTheme = createSelector(selectSettings, (settings) => settings.theme);

export const selectToCheckAuth = createSelector(selectSettings, (state) => state.toCheckAuth);

export const selectToFilterMetric = createSelector(selectSettings, (state) => state.toFilterMetric);
