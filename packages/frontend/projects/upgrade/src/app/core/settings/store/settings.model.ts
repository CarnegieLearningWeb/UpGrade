import { AppState } from '../../core.module';

export const SETTINGS_KEY = 'SETTINGS';

export interface SettingParams {
  toCheckAuth?: boolean;
  toFilterMetric?: boolean;
}

export interface SettingsState {
  toCheckAuth: boolean;
  toFilterMetric: boolean;
}

export interface State extends AppState {
  settings: SettingsState;
}
