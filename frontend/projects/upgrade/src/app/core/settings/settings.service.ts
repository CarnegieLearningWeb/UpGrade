import { Injectable } from '@angular/core';
import { AppState } from '../core.state';
import { Store, select } from '@ngrx/store';
import * as SettingsActions from './store/settings.actions';
import { selectToCheckAuth, selectToFilterMetric } from './store/settings.selectors';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable()
export class SettingsService {
  constructor(private store$: Store<AppState>, private localStorageService: LocalStorageService) {}

  toCheckAuth$ = this.store$.pipe(select(selectToCheckAuth));
  toFilterMetric$ = this.store$.pipe(select(selectToFilterMetric));

  setToCheckAuth(toCheckAuth: boolean) {
    this.store$.dispatch(SettingsActions.actionSetSetting({ setting: { toCheckAuth } }));
  }

  setToFilterMetric(toFilterMetric: boolean) {
    this.store$.dispatch(SettingsActions.actionSetSetting({ setting: { toFilterMetric } }));
  }
}
