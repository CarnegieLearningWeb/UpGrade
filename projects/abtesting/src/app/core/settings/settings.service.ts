import { Injectable } from '@angular/core';
import { AppState } from '../core.state';
import { Store, select } from '@ngrx/store';
import * as SettingsActions from './store/settings.actions';
import {
  selectToCheckAuth, selectTheme
} from './store/settings.selectors';
import { SETTINGS_KEY } from './store/settings.model';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable()
export class SettingsService {
  constructor(
    private store$: Store<AppState>,
    private localStorageService: LocalStorageService
  ) {}

  theme$ = this.store$.pipe(select(selectTheme));
  toCheckAuth$ = this.store$.pipe(select(selectToCheckAuth));

  changeTheme(theme) {
    this.store$.dispatch(SettingsActions.actionChangeTheme({ theme }));
  }

  setToCheckAuth(value: boolean) {
    this.store$.dispatch(SettingsActions.actionSetToCheckAuth({ toCheckAuth: value }));
  }

  setLocalStorageTheme() {
    const settings = this.localStorageService.getItem(SETTINGS_KEY);
    if (settings && settings.theme) {
      this.changeTheme(settings.theme);
    }
  }
}
