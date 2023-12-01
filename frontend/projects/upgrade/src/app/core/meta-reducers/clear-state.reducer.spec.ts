import { createReducer } from '@ngrx/store';
import { actionLogoutSuccess, actionLoginFailure } from '../auth/store/auth.actions';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ThemeOptions } from '../settings/store/settings.model';
import { clearState } from './clear-state.reducer';
import { ExperimentLocalStorageKeys } from '../experiments/store/experiments.model';

describe('clearState', () => {
  const mockState = {
    settings: {
      theme: ThemeOptions.DARK_THEME,
    },
    auth: {
      redirectUrl: '/test',
    },
  };

  beforeEach(() => {
    LocalStorageService.prototype.removeItem = jest.fn();
  });

  it('should reset settings and auth state except for theme and redirectUrl on actionLogoutSuccess, and also clear localStorage settings', () => {
    const reducer = createReducer(mockState);
    const metaReducer = clearState(reducer);
    const expectedResetState = {
      settings: {
        theme: ThemeOptions.DARK_THEME,
        toCheckAuth: null,
        toFilterMetric: null,
      },
      auth: {
        isLoggedIn: false,
        isAuthenticating: false,
        user: null,
        googleCredential: null,
        redirectUrl: '/test',
      },
    };

    const newState = metaReducer(mockState, actionLogoutSuccess());

    expect(LocalStorageService.prototype.removeItem).toHaveBeenCalledTimes(
      Object.keys(ExperimentLocalStorageKeys).length
    );
    expect(newState).toEqual(expectedResetState);
  });

  it('should NOT reset anything or clear localStorage if action is anything but actionLogoutSuccess', () => {
    const mockWithNonDefaultState = {
      ...mockState,
      auth: {
        ...mockState.auth,
        isLoggedIn: true,
      },
    };
    const reducer = createReducer(mockState);
    const metaReducer = clearState(reducer);
    const expectedResetState = {
      settings: {
        theme: ThemeOptions.DARK_THEME,
        toCheckAuth: null,
        toFilterMetric: null,
      },
      auth: {
        isLoggedIn: true,
        isAuthenticating: false,
        user: null,
        googleCredential: null,
        redirectUrl: '/test',
      },
    };

    const newState = metaReducer(mockWithNonDefaultState, actionLoginFailure());

    expect(LocalStorageService.prototype.removeItem).not.toHaveBeenCalledTimes(
      Object.keys(ExperimentLocalStorageKeys).length
    );
    expect(newState).not.toEqual(expectedResetState);
  });
});
