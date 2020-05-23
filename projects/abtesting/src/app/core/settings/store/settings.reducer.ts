import { SettingsState, ThemeOptions } from './settings.model';
import * as SettingsActions from './settings.actions';
import { Action, createReducer, on } from '@ngrx/store';

export const initialState: SettingsState = {
  theme: ThemeOptions.LIGHT_THEME,
  toCheckAuth: null,
};

const reducer = createReducer(
  initialState,
  on(
    SettingsActions.actionChangeTheme,
    (state, { theme }) => ({ ...state, theme })
  ),
  on(
    SettingsActions.actionSetToCheckAuthSuccess,
    SettingsActions.actionGetToCheckAuthSuccess,
    (state, { toCheckAuth }) => ({
      ...state,
      toCheckAuth
    })
  )
);

export function settingsReducer(
  state: SettingsState | undefined,
  action: Action
) {
  return reducer(state, action);
}
