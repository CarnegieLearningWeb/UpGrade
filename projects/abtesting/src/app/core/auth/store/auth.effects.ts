import { Injectable, NgZone } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as authActions from './auth.actions';
import * as experimentUserActions from '../../experiment-users/store/experiment-users.actions';
import * as logsActions from '../../logs/store/logs.actions';
import * as experimentActions from '../../experiments/store/experiments.actions';
import { tap, map, filter, withLatestFrom, catchError } from 'rxjs/operators';
import { AppState } from '../../core.module';
import { Store, select } from '@ngrx/store';
import { environment as env } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { selectRedirectUrl } from './auth.selectors';
import { AuthDataService } from '../auth.data.service';

declare const gapi: any;

@Injectable()
export class AuthEffects {
  auth2: any;
  scope = ['profile', 'email'].join(' ');

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private router: Router,
    private ngZone: NgZone,
    private authDataService: AuthDataService
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
                const profile = currentUser.getBasicProfile();
                const isCurrentUserSignedIn = this.auth2.isSignedIn.get();

                const action = isCurrentUserSignedIn
                  ? authActions.actionSetIsLoggedIn({ isLoggedIn: true })
                  : authActions.actionSetIsLoggedIn({ isLoggedIn: false });
                this.store$.dispatch(action);
                this.store$.dispatch(authActions.actionSetIsAuthenticating({ isAuthenticating: false }));
                if (!!profile && isCurrentUserSignedIn) {
                  const user = {
                    firstName: profile.getGivenName(),
                    lastName: profile.getFamilyName(),
                    email: profile.getEmail(),
                    imageUrl: profile.getImageUrl(),
                    token: currentUser.getAuthResponse().id_token
                  };
                  this.store$.dispatch(authActions.actionSetUserInfo({ user }));
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
          this.auth2.attachClickHandler(
            element,
            {},
            googleUser => {
              this.ngZone.run(() => {
                const profile = googleUser.getBasicProfile();
                const user = {
                  firstName: profile.getGivenName(),
                  lastName: profile.getFamilyName(),
                  email: profile.getEmail(),
                  imageUrl: profile.getImageUrl(),
                  token: googleUser.getAuthResponse().id_token
                };
                const id = profile.getId();
                this.authDataService
                  .createUser({ ...user, id })
                  .pipe(
                    tap(() => {
                      this.store$.dispatch(authActions.actionSetUserInfo({ user }));
                      this.store$.dispatch(authActions.actionLoginSuccess());
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
        tap(() => {
          this.store$.dispatch(experimentActions.actionGetAllExperiment());
          this.store$.dispatch(logsActions.actionGetAllAudit());
          this.store$.dispatch(experimentUserActions.actionFetchExcludedUsers());
          this.store$.dispatch(experimentUserActions.actionFetchExcludedGroups());
        })
      );
    },
    { dispatch: false }
  );

  logout$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionLogoutStart),
        tap(() => {
          this.auth2
            .signOut()
            .then(() => {
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
