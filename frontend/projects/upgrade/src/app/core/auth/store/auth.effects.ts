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
import { User } from '../../users/store/users.model';
import { SettingsService } from '../../settings/settings.service';
import { ENV, Environment } from '../../../../environments/environment-types';

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
    private settingsService: SettingsService,
    @Inject(ENV) private environment: Environment
  ) {}

  initializeGapi$ = createEffect(
    () => this.actions$.pipe(
        ofType(authActions.actionInitializeGapi),
        tap(() => {
          this.store$.dispatch(authActions.actionSetIsAuthenticating({ isAuthenticating: true }));
          gapi.load('auth2', () => this.handleGapiInit({
            client_id: this.environment.gapiClientId,
            hosted_domain: this.environment.domainName
          }));
        })
      ),
    { dispatch: false }
  );

  handleGapiInit = ({
    client_id,
    hosted_domain
  }) => {
    let initConfig: any = {
      client_id,
      cookiepolicy: 'single_host_origin',
      scope: this.scope,
    }
    if (hosted_domain) {
      initConfig = {
        ...initConfig,
        hosted_domain
      }
    }
    this.auth2 = gapi.auth2.init(initConfig);
    this.auth2.currentUser.listen(this.handleUserLoginInNgZone);
  }

  handleUserLoginInNgZone = currentUser => {
    this.ngZone.run(() => this.handleUserLogin(currentUser));
  }

  handleUserLogin = (currentUser) => {
    if (!this.hasUserClickedLogin) {
      const profile = currentUser.getBasicProfile();
      const isCurrentUserSignedIn = this.auth2.isSignedIn.get();

      const action = authActions.actionSetIsLoggedIn({ isLoggedIn: !!isCurrentUserSignedIn })

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
  }

  attachSignIn$ = createEffect(
    () => this.actions$.pipe(
        ofType(authActions.actionBindAttachHandlerWithButton),
        tap(() => this.handleAttachGoogleAuthClickHandler())
      ),
    { dispatch: false }
  );

  handleAttachGoogleAuthClickHandler = () => {
    const btn = this.authService.getGoogleSignInElementRef();
    console.log({ btn })
    this.auth2.attachClickHandler(btn, {},
      this.onAuthedUserFetchSuccess,
      this.onAuthedUserFetchError
    );
  }

  onAuthedUserFetchSuccess = (googleUser) => {
    this.hasUserClickedLogin = true;
    this.ngZone.run(() => this.handleGoogleAuthClickInNgZone(googleUser))
  }

  onAuthedUserFetchError = (error) => {
    console.log(JSON.stringify(error, undefined, 2));
    this.store$.dispatch(authActions.actionLoginFailure());
  }

  handleGoogleAuthClickInNgZone = (googleUser) => {
    const profile = googleUser.getBasicProfile();
    const user = {
      firstName: profile.getGivenName(),
      lastName: profile.getFamilyName(),
      email: profile.getEmail(),
      imageUrl: profile.getImageUrl(),
      localTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    const token = googleUser.getAuthResponse().id_token;
    // Store the token in the ngrx store as this is being passed in every request via http interceptor
    this.store$.dispatch(authActions.actionSetUserInfo({ user: { token } as User }));
    this.doLogin(user, token);
  };

  doLogin = (user, token: string) => {
    this.authDataService.login(user).pipe(
      tap((res: User) => {
        this.hasUserClickedLogin = false;
        this.store$.dispatch(authActions.actionLoginSuccess());
        this.deferSetUserInfoAfterNavigateEnd(res, token);
      }),
      catchError(() => [this.store$.dispatch(authActions.actionLoginFailure())])
    ).subscribe();
  }

  // wait after google auth login navs back to app on success to dispatch data fetches
  deferSetUserInfoAfterNavigateEnd = (res: User, token: string) => {
    let hasFired = false;
    this.router.events.pipe().subscribe(event => {
      if (!hasFired && event instanceof NavigationEnd) {
        hasFired = true;
        this.store$.dispatch(authActions.actionSetUserInfo({ user: { ...res, token } }));
      }
    });
  }

  setUserInfoInStore$ = createEffect(
    () => this.actions$.pipe(
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
            analysisActions.actionFetchMetrics()
          ];
          // Set theme from local storage if exist
          this.settingsService.setLocalStorageTheme();
          
          if (user.role) {
            return this.setUserSettingsWithRole(user, actions);
          } else {
            return this.trySetUserSettingWithEmail(user, actions);
          }
        })
      ),
  );

  setUserSettingsWithRole = (user: any, actions: Action[]) => {
    this.authService.setUserPermissions(user.role);
    return [
      authActions.actionSetUserInfoSuccess({ user }),
      ...actions
    ];
  }

  trySetUserSettingWithEmail = (user: any, actions: Action[]) => this.authDataService.getUserByEmail(user.email).pipe(
      switchMap((res: User) => {
        if (res[0]) {
          // Avoid null name in account
          if (res[0].firstName) {
            this.authService.setUserPermissions(res[0].role);
            return [
              authActions.actionSetUserInfoSuccess({ user: { ...res[0], token: user.token } }),
              ...actions
            ];
          } else {
            return [authActions.actionLogoutStart()];
          }
        } else {
          return [
            authActions.actionSetUserInfoFailed()
          ];
        }
      })
    )

  logout$ = createEffect(
    () => this.actions$.pipe(
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
      ),
    { dispatch: false }
  );

  navigationOnLoginSuccess$ = createEffect(
    () => this.actions$.pipe(
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
    () => this.actions$.pipe(
        ofType(authActions.actionLogoutSuccess),
        tap(() => {
          this.router.navigateByUrl('/login');
        })
      ),
    { dispatch: false }
  );
}
