import { ActivationEnd, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { select, Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, interval, merge, of } from 'rxjs';
import {
  tap,
  withLatestFrom,
  map,
  distinctUntilChanged,
  mapTo,
  filter,
  catchError,
  switchMap
} from 'rxjs/operators';

import { LocalStorageService } from '../../local-storage/local-storage.service';
import { TitleService } from '../../title/title.service';

import {
  actionSettingsChangeAnimationsElements,
  actionSettingsChangeAnimationsPage,
  actionSettingsChangeAnimationsPageDisabled,
  actionSettingsChangeAutoNightMode,
  actionSettingsChangeLanguage,
  actionSettingsChangeTheme,
  actionSettingsChangeStickyHeader,
  actionSettingsChangeHour,
  actionGetToCheckAuth,
  actionGetToCheckAuthSuccess,
  actionGetToCheckAuthFailure,
  actionSetToCheckAuth,
  actionSetToCheckAuthSuccess,
  actionSetToCheckAuthFailure
} from './settings.actions';
import {
  selectEffectiveTheme,
  selectSettingsLanguage,
  selectPageAnimations,
  selectElementsAnimations,
  selectSettingsState
} from './settings.selectors';
import { State } from './settings.model';
import { AnimationsService } from '../../animations/animations.service';
import { SettingsDataService } from '../settings.data.service';

export const SETTINGS_KEY = 'SETTINGS';

const INIT = of('init-effect-trigger');

@Injectable()
export class SettingsEffects {
  constructor(
    private actions$: Actions,
    private store: Store<State>,
    private router: Router,
    private overlayContainer: OverlayContainer,
    private localStorageService: LocalStorageService,
    private titleService: TitleService,
    private animationsService: AnimationsService,
    private translateService: TranslateService,
    private settingsDataService: SettingsDataService
  ) {}

  changeHour = createEffect(() =>
    interval(60_000).pipe(
      mapTo(new Date().getHours()),
      distinctUntilChanged(),
      map(hour => actionSettingsChangeHour({ hour }))
    )
  );

  persistSettings = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          actionSettingsChangeAnimationsElements,
          actionSettingsChangeAnimationsPage,
          actionSettingsChangeAnimationsPageDisabled,
          actionSettingsChangeAutoNightMode,
          actionSettingsChangeLanguage,
          actionSettingsChangeStickyHeader,
          actionSettingsChangeTheme
        ),
        withLatestFrom(this.store.pipe(select(selectSettingsState))),
        tap(([action, settings]) =>
          this.localStorageService.setItem(SETTINGS_KEY, settings)
        )
      ),
    { dispatch: false }
  );

  updateRouteAnimationType = createEffect(
    () =>
      merge(
        INIT,
        this.actions$.pipe(
          ofType(
            actionSettingsChangeAnimationsElements,
            actionSettingsChangeAnimationsPage
          )
        )
      ).pipe(
        withLatestFrom(
          combineLatest([
            this.store.pipe(select(selectPageAnimations)),
            this.store.pipe(select(selectElementsAnimations))
          ])
        ),
        tap(([action, [pageAnimations, elementsAnimations]]) =>
          this.animationsService.updateRouteAnimationType(
            pageAnimations,
            elementsAnimations
          )
        )
      ),
    { dispatch: false }
  );

  updateTheme = createEffect(
    () =>
      merge(INIT, this.actions$.pipe(ofType(actionSettingsChangeTheme))).pipe(
        withLatestFrom(this.store.pipe(select(selectEffectiveTheme))),
        tap(([action, effectiveTheme]) => {
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

  setTranslateServiceLanguage = createEffect(
    () =>
      this.store.pipe(
        select(selectSettingsLanguage),
        distinctUntilChanged(),
        tap(language => this.translateService.use(language))
      ),
    { dispatch: false }
  );

  setTitle = createEffect(
    () =>
      merge(
        this.actions$.pipe(ofType(actionSettingsChangeLanguage)),
        this.router.events.pipe(filter(event => event instanceof ActivationEnd))
      ).pipe(
        tap(() => {
          this.titleService.setTitle(
            this.router.routerState.snapshot.root,
            this.translateService
          );
        })
      ),
    { dispatch: false }
  );

  getToCheckAuth$ = createEffect(
    () => this.actions$.pipe(
      ofType(actionGetToCheckAuth),
      switchMap(() => {
        return this.settingsDataService.getSettings().pipe(
          map((data: any) => actionGetToCheckAuthSuccess({ toCheckAuth: data.toCheck })),
          catchError(() => [actionGetToCheckAuthFailure()])
        )
      })
    )
  );

  setToCheckAuth$ = createEffect(
    () => this.actions$.pipe(
      ofType(actionSetToCheckAuth),
      map(action => action.toCheckAuth),
      switchMap((toCheckAuth) => {
        return this.settingsDataService.setSettings(toCheckAuth).pipe(
          map((data: any) => actionSetToCheckAuthSuccess({ toCheckAuth: data.toCheck })),
          catchError(() => [actionSetToCheckAuthFailure()])
        )
      })
    )
  );
}
