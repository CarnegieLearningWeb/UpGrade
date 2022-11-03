import { SettingsState, ThemeOptions } from './settings.model';
import * as SettingsActions from './settings.actions';
import { Action, createReducer, on } from '@ngrx/store';

export const initialState: SettingsState = {
  theme: ThemeOptions.LIGHT_THEME,
  toCheckAuth: null,
  toFilterMetric: null,
};

const reducer = createReducer(
  initialState,
  on(SettingsActions.actionChangeTheme, (state, { theme }) => ({ ...state, theme })),
  on(SettingsActions.actionSetSettingSuccess, SettingsActions.actionGetSettingSuccess, (state, { setting }) => ({
    ...state,
    toCheckAuth: (setting && (setting as any).toCheckAuth) || false,
    toFilterMetric: (setting && (setting as any).toFilterMetric) || false,
  }))
);

export function settingsReducer(state: SettingsState | undefined, action: Action) {
  return reducer(state, action);
}
