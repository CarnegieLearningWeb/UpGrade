import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as authActions from './auth.actions';
import * as experimentUserActions from '../../experiment-users/store/experiment-users.actions';
import * as experimentActions from '../../experiments/store/experiments.actions';
import * as usersActions from '../../users/store/users.actions';
import * as analysisActions from '../../analysis/store/analysis.actions';
import * as settingsActions from '../../settings/store/settings.actions';
import { tap, map, filter, withLatestFrom, catchError, switchMap } from 'rxjs/operators';
import { AppState } from '../../core.module';
import { Store, select } from '@ngrx/store';
import { Router } from '@angular/router';
import { selectRedirectUrl } from './auth.selectors';
import { AuthDataService } from '../auth.data.service';
import { AuthService } from '../auth.service';
import { User } from '../../users/store/users.model';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private router: Router,
    private authDataService: AuthDataService,
    private authService: AuthService
  ) {}

  fetchUserExperimentData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.actionFetchUserExperimentData),
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

        if (user.role) {
          return this.authService.setUserSettingsWithRole(user, actions);
        } else {
          return [authActions.actionSetUserInfoWithEmail({ user, actions })];
        }
      })
    )
  );

  setUserInfoWithEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.actionSetUserInfoWithEmail),
      switchMap(({ user, actions }) => {
        return this.authDataService.getUserByEmail(user.email).pipe(
          switchMap((res: User) => {
            if (res[0]) {
              // Avoid null name in account
              if (res[0].firstName) {
                this.authService.setUserPermissions(res[0].role);
                this.authService.setUserInBrowserStorage(user);
                return [authActions.actionSetUserInfoSuccess({ user: { ...res[0], token: user.token } }), ...actions];
              } else {
                return [authActions.actionLogoutStart()];
              }
            } else {
              return [authActions.actionSetUserInfoFailed()];
            }
          }),
          catchError(() => {
            return [authActions.actionSetUserInfoFailed()];
          })
        );
      })
    )
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.actionLoginStart),
      filter(({ user }) => !!user),
      switchMap((action) => {
        return this.authDataService.login(action.user).pipe(
          map(() => authActions.actionLoginSuccess({ user: action.user, googleCredential: action.googleCredential })),
          catchError(() => {
            return [authActions.actionLoginFailure()];
          })
        );
      })
    )
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.actionLogoutStart),
        tap(() => {
          this.authService.removeUserFromBrowserStorage();
          this.store$.dispatch(authActions.actionLogoutSuccess());
        })
      ),
    { dispatch: false }
  );

  navigationOnLoginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.actionLoginSuccess),
        withLatestFrom(this.store$.pipe(select(selectRedirectUrl))),
        tap(([action, redirectUrl]) => {
          this.authService.deferFetchUserExperimentDataAfterNavigationEnd(action.user, action.googleCredential);
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
