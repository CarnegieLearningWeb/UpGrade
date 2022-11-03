import { createReducer } from '@ngrx/store';
import { actionLogoutSuccess } from '../auth/store/auth.actions';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ThemeOptions } from '../settings/store/settings.model';
import { clearState } from './clear-state.reducer';
import { ExperimentLocalStorageKeys } from '../experiments/store/experiments.model';

describe('clearState', () => {
  const mockState = {
    settings: {
      theme: ThemeOptions.DARK_THEME,
    },
  };

  beforeEach(() => {
    LocalStorageService.prototype.removeItem = jest.fn();
  });

  it('should reset settings state and clear localStorage settings', () => {
    const reducer = createReducer(mockState);
    const metaReducer = clearState(reducer);
    const expectedResetState = {
      settings: {
        theme: ThemeOptions.DARK_THEME,
        toCheckAuth: null,
        toFilterMetric: null,
      },
    };

    const newState = metaReducer(mockState, actionLogoutSuccess());

    expect(LocalStorageService.prototype.removeItem).toHaveBeenCalledTimes(
      Object.keys(ExperimentLocalStorageKeys).length
    );
    expect(newState).toEqual(expectedResetState);
  });
});
