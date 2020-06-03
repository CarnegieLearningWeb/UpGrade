import { Injectable, NgZone } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as authActions from './auth.actions';
import * as experimentUserActions from '../../experiment-users/store/experiment-users.actions';
import * as experimentActions from '../../experiments/store/experiments.actions';
import * as usersActions from '../../users/store/users.actions';
import * as featureFlagsActions from '../../feature-flags/store/feature-flags.actions';
import * as settingsActions from '../../settings/store/settings.actions';
import { tap, map, filter, withLatestFrom, catchError, switchMap } from 'rxjs/operators';
import { AppState } from '../../core.module';
import { Store, select } from '@ngrx/store';
import { environment as env } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { selectRedirectUrl } from './auth.selectors';
import { AuthDataService } from '../auth.data.service';
import { AuthService } from '../auth.service';
import { User } from '../../users/store/users.model';
import { SettingsService } from '../../settings/settings.service';

declare const gapi: any;

@Injectable()
export class AuthEffects {
  auth2: any;
  scope = ['profile', 'email'].join(' ');

  // Used to control flow of currentUser listener
  hasUserClickedLogin = false;

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private router: Router,
    private ngZone: NgZone,
    private authDataService: AuthDataService,
    private authService: AuthService,
    private settingsService: SettingsService
  ) {}

  initializeGapi$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionInitializeGapi),
        tap(() => {
          this.store$.dispatch(authActions.actionSetIsAuthenticating({ isAuthenticating: true }));
          gapi.load('auth2', () => {
            this.auth2 = gapi.auth2.init({
              client_id: env.gapiClientId,
              cookiepolicy: 'single_host_origin',
              scope: this.scope
            });
            this.auth2.currentUser.listen(currentUser => {
              this.ngZone.run(() => {
                if (!this.hasUserClickedLogin) {
                  const profile = currentUser.getBasicProfile();
                  const isCurrentUserSignedIn = this.auth2.isSignedIn.get();

                  const action = isCurrentUserSignedIn
                    ? authActions.actionSetIsLoggedIn({ isLoggedIn: true })
                    : authActions.actionSetIsLoggedIn({ isLoggedIn: false });
                  this.store$.dispatch(action);
                  this.store$.dispatch(authActions.actionSetIsAuthenticating({ isAuthenticating: false }));
                  if (!!profile && isCurrentUserSignedIn) {
                    const user: any = {
                      token: currentUser.getAuthResponse().id_token,
                      email: profile.getEmail()
                    };
                    this.store$.dispatch(authActions.actionSetUserInfo({ user }));
                  }
                }
              });
            });
          });
        })
      );
    },
    { dispatch: false }
  );

  attachSignIn$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionBindAttachHandlerWithButton),
        map(action => action.element),
        filter(element => !!element),
        tap(element => {
          this.auth2.attachClickHandler(element, {},
            googleUser => {
              this.hasUserClickedLogin = true;
              this.ngZone.run(() => {
                const profile = googleUser.getBasicProfile();
                const user = {
                  firstName: profile.getGivenName(),
                  lastName: profile.getFamilyName(),
                  email: profile.getEmail(),
                  imageUrl: profile.getImageUrl(),
                };
                const token = googleUser.getAuthResponse().id_token;
                this.authDataService.createUser(user).pipe(
                    tap((res: User) => {
                      this.hasUserClickedLogin = false;
                      this.store$.dispatch(authActions.actionLoginSuccess());
                      this.store$.dispatch(authActions.actionSetUserInfo({ user: { ...res, token } }));
                    }),
                    catchError(() => [this.store$.dispatch(authActions.actionLoginFailure())])
                  )
                  .subscribe();
              });
            },
            error => {
              console.log(JSON.stringify(error, undefined, 2));
              this.store$.dispatch(authActions.actionLoginFailure());
            }
          );
        })
      );
    },
    { dispatch: false }
  );

  setUserInfoInStore$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionSetUserInfo),
        map(action => action.user),
        filter(user => !!user.email),
        switchMap((user: User) => {
          const actions = [
            experimentUserActions.actionFetchExcludedUsers(),
            experimentUserActions.actionFetchExcludedGroups(),
            experimentActions.actionFetchAllPartitions(),
            usersActions.actionFetchUsers({ fromStarting: true }),
            settingsActions.actionGetSetting(),
          ];
          // Set theme from localstorage if exist
          this.settingsService.setLocalStorageTheme();
          if (user.role) {
            this.authService.setUserPermissions(user.role);
            return [
              authActions.actionSetUserInfoSuccess({ user }),
              ...actions
            ];
          } else {
            return this.authDataService.getUserByEmail(user.email).pipe(
              switchMap((res: User) => {
                if (res[0]) {
                  this.authService.setUserPermissions(res[0].role);
                  return [
                    authActions.actionSetUserInfoSuccess({ user: { ...res[0], token: user.token } }),
                    ...actions
                  ];
                } else {
                  return [
                    authActions.actionSetUserInfoFailed()
                  ];
                }
              })
            )
          }
        })
      );
    },
  );

  logout$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionLogoutStart),
        tap(() => {
          this.auth2.signOut().then(() => {
              this.ngZone.run(() => {
                this.store$.dispatch(authActions.actionLogoutSuccess());
              });
            })
            .catch(() => {
              this.store$.dispatch(authActions.actionLogoutFailure());
            });
        })
      );
    },
    { dispatch: false }
  );

  navigationOnLoginSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionLoginSuccess),
        withLatestFrom(this.store$.pipe(select(selectRedirectUrl))),
        tap(([, redirectUrl]) => {
          const path = redirectUrl || '/home';
          this.router.navigate([path]);
        })
      );
    },
    { dispatch: false }
  );

  navigationOnLogOutSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionLogoutSuccess),
        tap(() => {
          this.router.navigateByUrl('/login');
        })
      );
    },
    { dispatch: false }
  );
}
