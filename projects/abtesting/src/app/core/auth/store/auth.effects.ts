import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as authActions from './auth.actions';
import { tap, map, filter } from 'rxjs/operators';
import { AppState } from '../../core.module';
import { Store } from '@ngrx/store';
import { environment as env } from '../../../../environments/environment';
import { Router } from '@angular/router';

declare const gapi: any;

@Injectable()
export class AuthEffects {

  auth2: any;
  scope = [
    'profile',
    'email',
  ].join(' ');

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private router: Router
  ) {}

  initializeGapi$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionInitializeGapi),
        tap(() => {
          gapi.load('auth2', () => {
            this.auth2 = gapi.auth2.init({
              client_id: env.gapiClientId,
              cookiepolicy: 'single_host_origin',
              scope: this.scope
            });
            this.store$.dispatch(authActions.actionSetIsAuthenticating({ isAuthenticating: true }));
            this.auth2.currentUser.listen((currentUser) => {
              const profile = currentUser.getBasicProfile();
              const isCurrentUserSignedIn = this.auth2.isSignedIn.get();

              const action = isCurrentUserSignedIn
                ? authActions.actionSetIsLoggedIn({ isLoggedIn: true })
                : authActions.actionSetIsLoggedIn({ isLoggedIn: false });
              this.store$.dispatch(action);
              this.store$.dispatch(authActions.actionSetIsAuthenticating({ isAuthenticating: false }));
              if (!!profile && isCurrentUserSignedIn) {
                const user = {
                  name: profile.getName(),
                  email: profile.getEmail(),
                  imageUrl: profile.getImageUrl()
                };
                this.store$.dispatch(authActions.actionSetUserInfo({ user }));
              }
            })
          });
        })
      )
    },
    { dispatch: false }
  );

  attachSignIn$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionBindAttachHandlerWithButton),
        map(action => action.element),
        filter(element => !!element),
        tap((element) => {
          this.auth2.attachClickHandler(element, {},
            (googleUser) => {
              const profile = googleUser.getBasicProfile();
              const user = {
                name: profile.getName(),
                email: profile.getEmail(),
                imageUrl: profile.getImageUrl()
              };
              this.store$.dispatch(authActions.actionSetUserInfo({ user }));
              this.store$.dispatch(authActions.actionLoginSuccess());
            }, (error) => {
              console.log(JSON.stringify(error, undefined, 2));
              this.store$.dispatch(authActions.actionLoginFailure());
            });
        })
      )
    },
    { dispatch: false }
  );

  logout$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionLogoutStart),
        tap(() => {
          this.auth2.signOut().then(() => {
            this.store$.dispatch(authActions.actionLogoutSuccess());
          }).catch(() => {
            this.store$.dispatch(authActions.actionLogoutFailure());
          });
        })
      )
    },
    { dispatch: false }
  );

  navigationOnLoginSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionLoginSuccess),
        tap(() => {
          this.router.navigate(['/home']);
        })
      )
    },
    { dispatch: false }
  );

  navigationOnLogOutSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(authActions.actionLogoutSuccess),
        tap(() => {
          this.router.navigate(['/login']);
        })
      )
    },
    { dispatch: false }
  );

}
