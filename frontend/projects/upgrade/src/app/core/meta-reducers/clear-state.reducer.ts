import { Action } from '@ngrx/store';
import * as AuthActions from '../auth/store/auth.actions';
import { ExperimentLocalStorageKeys } from '../experiments/store/experiments.model';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { SettingsState } from '../settings/store/settings.model';
import { AuthState } from '../auth/store/auth.models';

export function clearState(reducer) {
  return (state, action: Action) => {
    if (action.type === AuthActions.actionLogoutSuccess.type) {
      const settingState: SettingsState = {
        theme: state.settings.theme,
        toCheckAuth: null,
        toFilterMetric: null,
      };
      const authState: AuthState = {
        isLoggedIn: false,
        isAuthenticating: false,
        user: null,
        googleCredential: null,
        redirectUrl: state.auth.redirectUrl,
      };
      const localStorageService = new LocalStorageService();

      state = {
        settings: settingState, // Used to persist theme,
        auth: authState, // Used to persist redirectUrl
      };

      Object.values(ExperimentLocalStorageKeys).forEach((key) => {
        localStorageService.removeItem(key);
      });
    }
    return reducer(state, action);
  };
}
