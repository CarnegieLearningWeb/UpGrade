import { Injectable } from '@angular/core';
import { AppState } from '../core.state';
import { Store, select } from '@ngrx/store';
import * as SettingsActions from './store/settings.actions';
import { Language } from './store/settings.model';
import { selectSettingsStickyHeader, selectSettingsLanguage, selectEffectiveTheme } from './store/settings.selectors';

@Injectable()
export class SettingsService {

  constructor(private store$: Store<AppState>) {}

  stickyHeader$ = this.store$.pipe(select(selectSettingsStickyHeader));
  language$ = this.store$.pipe(select(selectSettingsLanguage));
  theme$ = this.store$.pipe(select(selectEffectiveTheme));

  changeTheme(theme) {
    this.store$.dispatch(SettingsActions.actionSettingsChangeTheme({ theme }));
  }

  changeAnimationsPageDisabled(value: boolean) {
    this.store$.dispatch(SettingsActions.actionSettingsChangeAnimationsPageDisabled({pageAnimationsDisabled: value})
    );
  }

  changeLanguage(language: Language) {
    this.store$.dispatch(SettingsActions.actionSettingsChangeLanguage({ language }));
  }
}
