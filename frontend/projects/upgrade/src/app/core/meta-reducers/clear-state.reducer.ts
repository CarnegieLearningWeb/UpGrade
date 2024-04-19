import { Action } from '@ngrx/store';
import * as AuthActions from '../auth/store/auth.actions';
import { ExperimentLocalStorageKeys } from '../experiments/store/experiments.model';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { AuthState } from '../auth/store/auth.models';

export function clearState(reducer) {
  return (state, action: Action) => {
    if (action.type === AuthActions.actionLogoutSuccess.type) {
      const authState: AuthState = {
        isLoggedIn: false,
        isAuthenticating: false,
        user: null,
        googleCredential: null,
        redirectUrl: state.auth.redirectUrl,
      };
      const localStorageService = new LocalStorageService();

      state = {
        auth: authState, // Used to persist redirectUrl
      };

      Object.values(ExperimentLocalStorageKeys).forEach((key) => {
        localStorageService.removeItem(key);
      });
    }
    return reducer(state, action);
  };
}
