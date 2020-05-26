import { AppState } from '../../core.module';

export const SETTINGS_KEY = 'SETTINGS';

export enum ThemeOptions {
  LIGHT_THEME = 'light-theme',
  DARK_THEME = 'dark-theme'
}

export interface SettingsState {
  theme: ThemeOptions;
  toCheckAuth: boolean;
}

export interface State extends AppState {
  settings: SettingsState;
}
