import { Action } from '@ngrx/store';
import * as AuthActions from '../auth/store/auth.actions';
import { SettingsState } from '../settings/store/settings.model';

export function clearState(reducer) {
  return (state, action: Action) => {
    if (action.type === AuthActions.actionLogoutSuccess.type) {
      const settingState: SettingsState = {
        theme: state.settings.theme,
        toCheckAuth: null,
        toFilterMetric: null
      };

      state = {
        settings: settingState, // Used to persist theme,
      };
    }
    return reducer(state, action);
  };
}
