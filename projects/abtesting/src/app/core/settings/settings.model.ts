import { AppState } from '../core.module';

export type Language = 'en' | 'sk' | 'de' | 'fr' | 'es' | 'pt-br' | 'he';

export enum ThemeOptions {
  DEFAULT_THEME = 'default-theme',
  DARK_THEME = 'black-theme',
  NATURE_THEME = 'nature-theme',
  LIGHT_THEME = 'light-theme'
}

export interface SettingsState {
  language: string;
  theme: ThemeOptions;
  autoNightMode: boolean;
  nightTheme: ThemeOptions;
  stickyHeader: boolean;
  pageAnimations: boolean;
  pageAnimationsDisabled: boolean;
  elementsAnimations: boolean;
  hour: number;
}

export interface State extends AppState {
  settings: SettingsState;
}
