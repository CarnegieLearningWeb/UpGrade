import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { merge } from 'rxjs';
import { tap, map, catchError, switchMap, filter } from 'rxjs/operators';

import * as SettingsActions from './settings.actions';
import { SettingsDataService } from '../settings.data.service';
import { ActivationEnd, Router } from '@angular/router';
import { TitleService } from '../../title/title.service';

@Injectable()
export class SettingsEffects {
  constructor(
    private actions$: Actions,
    private router: Router,
    private titleService: TitleService,
    private settingsDataService: SettingsDataService
  ) {}

  getSetting$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SettingsActions.actionGetSetting),
      switchMap(() =>
        this.settingsDataService.getSettings().pipe(
          map((data: any) => SettingsActions.actionGetSettingSuccess({ setting: data })),
          catchError(() => [SettingsActions.actionGetSettingFailure()])
        )
      )
    )
  );

  setSetting$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SettingsActions.actionSetSetting),
      map((action) => action.setting),
      switchMap(({ toCheckAuth, toFilterMetric }) => {
        let settingParams: any = {};
        if (toCheckAuth !== undefined) {
          settingParams = {
            ...settingParams,
            toCheckAuth,
          };
        }
        if (toFilterMetric !== undefined) {
          settingParams = {
            ...settingParams,
            toFilterMetric,
          };
        }
        return this.settingsDataService.setSettings(settingParams).pipe(
          map((data: any) => SettingsActions.actionSetSettingSuccess({ setting: data })),
          catchError(() => [SettingsActions.actionSetSettingFailure()])
        );
      })
    )
  );

  setTitle = createEffect(
    () =>
      merge(this.router.events.pipe(filter((event) => event instanceof ActivationEnd))).pipe(
        tap(() => {
          this.titleService.setTitle(this.router.routerState.snapshot.root);
        })
      ),
    { dispatch: false }
  );
}
