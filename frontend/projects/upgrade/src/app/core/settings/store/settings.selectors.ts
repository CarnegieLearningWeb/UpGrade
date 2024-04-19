import { createSelector, createFeatureSelector } from '@ngrx/store';

import { SettingsState } from './settings.model';

export const selectSettingsState = createFeatureSelector<SettingsState>('settings');

export const selectSettings = createSelector(selectSettingsState, (state: SettingsState) => state);

export const selectToCheckAuth = createSelector(selectSettings, (state) => state.toCheckAuth);

export const selectToFilterMetric = createSelector(selectSettings, (state) => state.toFilterMetric);
