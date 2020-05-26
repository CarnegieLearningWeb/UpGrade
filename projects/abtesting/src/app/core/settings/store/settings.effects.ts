import { Injectable } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { select, Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { merge, of } from 'rxjs';
import {
  tap,
  withLatestFrom,
  map,
  catchError,
  switchMap,
  filter
} from 'rxjs/operators';

import { LocalStorageService } from '../../local-storage/local-storage.service';

import * as SettingsActions from './settings.actions';
import {
  selectSettingsState, selectTheme
} from './settings.selectors';
import { State, SETTINGS_KEY } from './settings.model';
import { SettingsDataService } from '../settings.data.service';
import { ActivationEnd, Router } from '@angular/router';
import { TitleService } from '../../title/title.service';


const INIT = of('init-effect-trigger');

@Injectable()
export class SettingsEffects {
  constructor(
    private actions$: Actions,
    private store: Store<State>,
    private router: Router,
    private titleService: TitleService,
    private overlayContainer: OverlayContainer,
    private localStorageService: LocalStorageService,
    private settingsDataService: SettingsDataService
  ) {}

  persistSettings = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SettingsActions.actionChangeTheme),
        withLatestFrom(this.store.pipe(select(selectSettingsState))),
        tap(([, { theme }]) =>
          this.localStorageService.setItem(SETTINGS_KEY, { theme })
        )
      ),
    { dispatch: false }
  );

  updateTheme = createEffect(
    () =>
      merge(INIT, this.actions$.pipe(ofType(SettingsActions.actionChangeTheme))).pipe(
        withLatestFrom(this.store.pipe(select(selectTheme))),
        tap(([, effectiveTheme]) => {
          const classList = this.overlayContainer.getContainerElement()
            .classList;
          const toRemove = Array.from(classList).filter((item: string) =>
            item.includes('-theme')
          );
          if (toRemove.length) {
            classList.remove(...toRemove);
          }
          classList.add(effectiveTheme);
        })
      ),
    { dispatch: false }
  );

  getToCheckAuth$ = createEffect(
    () => this.actions$.pipe(
      ofType(SettingsActions.actionGetToCheckAuth),
      switchMap(() => {
        return this.settingsDataService.getSettings().pipe(
          map((data: any) => SettingsActions.actionGetToCheckAuthSuccess({ toCheckAuth: data.toCheck })),
          catchError(() => [SettingsActions.actionGetToCheckAuthFailure()])
        )
      })
    )
  );

  setToCheckAuth$ = createEffect(
    () => this.actions$.pipe(
      ofType(SettingsActions.actionSetToCheckAuth),
      map(action => action.toCheckAuth),
      switchMap((toCheckAuth) => {
        return this.settingsDataService.setSettings(toCheckAuth).pipe(
          map((data: any) => SettingsActions.actionSetToCheckAuthSuccess({ toCheckAuth: data.toCheck })),
          catchError(() => [SettingsActions.actionSetToCheckAuthFailure()])
        )
      })
    )
  );

  setTitle = createEffect(
    () =>
      merge(
        this.router.events.pipe(filter(event => event instanceof ActivationEnd))
      ).pipe(
        tap(() => {
          this.titleService.setTitle(
            this.router.routerState.snapshot.root
          );
        })
      ),
    { dispatch: false }
  );
}
