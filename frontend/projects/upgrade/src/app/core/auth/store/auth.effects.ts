import { Injectable, Inject, NgZone } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as authActions from './auth.actions';
import * as experimentUserActions from '../../experiment-users/store/experiment-users.actions';
import * as experimentActions from '../../experiments/store/experiments.actions';
import * as usersActions from '../../users/store/users.actions';
import * as analysisActions from '../../analysis/store/analysis.actions';
import * as settingsActions from '../../settings/store/settings.actions';
import { tap, map, filter, withLatestFrom, catchError, switchMap } from 'rxjs/operators';
import { AppState } from '../../core.module';
import { Store, select, Action } from '@ngrx/store';
import { NavigationEnd, Router } from '@angular/router';
import { selectRedirectUrl } from './auth.selectors';
import { AuthDataService } from '../auth.data.service';
import { AuthService } from '../auth.service';
import { User, UserRole } from '../../users/store/users.model';
import { SettingsService } from '../../settings/settings.service';
import { ENV, Environment } from '../../../../environments/environment-types';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private router: Router,
    private ngZone: NgZone,
    private authDataService: AuthDataService,
    private authService: AuthService,
    private settingsService: SettingsService,
    @Inject(ENV) private environment: Environment
  ) {}

  setUserInfoInStore$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.actionSetUserInfo),
      map((action) => action.user),
      filter((user) => !!user.email),
      switchMap((user: User) => {
        const actions = [
          experimentUserActions.actionFetchExcludedUsers(),
          experimentUserActions.actionFetchExcludedGroups(),
          experimentActions.actionFetchAllDecisionPoints(),
          usersActions.actionFetchUsers({ fromStarting: true }),
          settingsActions.actionGetSetting(),
          analysisActions.actionFetchMetrics(),
        ];
        // Set theme from local storage if exist
        this.settingsService.setLocalStorageTheme();
        if (!user.role) {
          user.role === UserRole.READER;
        }
        // if (user.role) {
        return this.authService.setUserSettingsWithRole(user, actions);
        // } else {
        //   this.authService.trySetUserSettingWithEmail(user, actions);
        // }
      })
    )
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.actionLogoutStart),
        tap(() => {
          this.ngZone.run(() => {
            this.authService.removeStoredUser();
            this.store$.dispatch(authActions.actionLogoutSuccess());
          });
        })
      ),
    { dispatch: false }
  );

  navigationOnLoginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.actionLoginSuccess),
        withLatestFrom(this.store$.pipe(select(selectRedirectUrl))),
        tap(([, redirectUrl]) => {
          const path = redirectUrl || '/home';
          this.router.navigate([path]);
        })
      ),
    { dispatch: false }
  );

  navigationOnLogOutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.actionLogoutSuccess),
        tap(() => {
          this.router.navigateByUrl('/login');
        })
      ),
    { dispatch: false }
  );
}
