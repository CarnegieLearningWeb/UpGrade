import { AppState } from '../core.module';

export const NIGHT_MODE_THEME = 'BLACK-THEME';

export type Language = 'en' | 'sk' | 'de' | 'fr' | 'es' | 'pt-br' | 'he';

export interface SettingsState {
  language: string;
  theme: string;
  autoNightMode: boolean;
  nightTheme: string;
  stickyHeader: boolean;
  pageAnimations: boolean;
  pageAnimationsDisabled: boolean;
  elementsAnimations: boolean;
  hour: number;
}

export enum ThemeOptions {
  DEFAULT_THEME = 'default-theme',
  DARK_THEME = 'black-theme',
  NATURE_THEME = 'nature-theme',
  LIGHT_THEME = 'light-theme'
}

export interface State extends AppState {
  settings: SettingsState;
}
