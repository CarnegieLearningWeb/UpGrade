import * as SettingsActions from './settings.actions';
import { ThemeOptions } from './settings.model';

describe('Settings Actions', () => {
  it('should create ActionChangeTheme action', () => {
    const action = SettingsActions.actionChangeTheme({
      theme: ThemeOptions.DARK_THEME
    });

    expect(action.type).toEqual(SettingsActions.actionChangeTheme.type);
    expect(action.theme).toEqual(ThemeOptions.DARK_THEME);
  });
});
