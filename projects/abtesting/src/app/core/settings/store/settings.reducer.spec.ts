import { initialState, settingsReducer } from './settings.reducer';

import * as SettingsActions from './settings.actions';
import { ThemeOptions } from './settings.model';

describe('SettingsReducer', () => {
  it('should return default state', () => {
    const action = {} as any;
    const state = settingsReducer(undefined, action);
    expect(state).toBe(initialState);
  });

  it('should update theme', () => {
    const action = SettingsActions.actionChangeTheme({ theme: ThemeOptions.DARK_THEME });
    const state = settingsReducer(undefined, action);
    expect(state.theme).toEqual(ThemeOptions.DARK_THEME);
  });
});
