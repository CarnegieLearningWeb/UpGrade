import * as assert from 'assert';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Actions, getEffectsMetadata } from '@ngrx/effects';
import { TestScheduler } from 'rxjs/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import {
  AppState,
  LocalStorageService} from '../../core.module';

import { SettingsEffects } from './settings.effects';
import { SettingsState, ThemeOptions, SETTINGS_KEY } from './settings.model';
import * as SettingsActions from './settings.actions';
import { SettingsDataService } from '../settings.data.service';

const scheduler = new TestScheduler((actual, expected) =>
  assert.deepStrictEqual(actual, expected)
);

describe('SettingsEffects', () => {
  let router: any;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let overlayContainer: jasmine.SpyObj<OverlayContainer>;
  let settingsDataService: jasmine.SpyObj<SettingsDataService>;
  let store: jasmine.SpyObj<Store<AppState>>;

  beforeEach(() => {
    router = {
      routerState: {
        snapshot: {}
      },
      events: {
        pipe() {}
      }
    };
    localStorageService = jasmine.createSpyObj('LocalStorageService', [
      'setItem'
    ]);
    overlayContainer = jasmine.createSpyObj('OverlayContainer', [
      'getContainerElement'
    ]);
    settingsDataService = jasmine.createSpyObj('settingsDataService', [
      'getSettings'
    ]);
    store = jasmine.createSpyObj('store', ['pipe']);
  });

  describe('persistSettings', () => {
    it('should not dispatch any action', () => {
      const actions = new Actions<any>();
      const effect = new SettingsEffects(
        actions,
        store,
        overlayContainer,
        localStorageService,
        settingsDataService
      );
      const metadata = getEffectsMetadata(effect);

      expect(metadata.persistSettings.dispatch).toEqual(false);
    });
  });

  it('should call methods on LocalStorageService for PERSIST action', () => {
    scheduler.run(helpers => {
      const { cold } = helpers;

      const settings: SettingsState = {
        theme: ThemeOptions.DARK_THEME,
        toCheckAuth: false
      };
      store.pipe.and.returnValue(of(settings));
      const persistAction = SettingsActions.actionChangeTheme({ theme: ThemeOptions.DARK_THEME });
      const source = cold('a', { a: persistAction });
      const actions = new Actions(source);
      const effect = new SettingsEffects(
        actions,
        store,
        overlayContainer,
        localStorageService,
        settingsDataService
      );

      effect.persistSettings.subscribe(() => {
        expect(localStorageService.setItem).toHaveBeenCalledWith(
          SETTINGS_KEY,
          settings
        );
      });
    });
  });
});
