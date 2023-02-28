import { ElementRef, Inject, Injectable, NgZone } from '@angular/core';
import { AppState, LocalStorageService } from '../core.module';
import { Store, select, Action } from '@ngrx/store';
import * as AuthActions from './store/auth.actions';
import { selectIsLoggedIn, selectIsAuthenticating, selectCurrentUser } from './store/auth.selectors';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { UserPermission } from './store/auth.models';
import { BehaviorSubject } from 'rxjs';
import { User, UserRole } from '../users/store/users.model';
import { ENV, Environment } from '../../../environments/environment-types';
import jwt_decode, { JwtPayload } from 'jwt-decode';
import { AuthDataService } from './auth.data.service';
import { NavigationEnd, Router } from '@angular/router';

@Injectable()
export class AuthService {
  isLoggedIn$ = this.store$.pipe(select(selectIsLoggedIn));
  isAuthenticating$ = this.store$.pipe(select(selectIsAuthenticating));
  currentUser$ = this.store$.pipe(select(selectCurrentUser));
  getIdToken$ = this.store$.pipe(
    select(selectCurrentUser),
    map((currentUser) => (currentUser ? currentUser.token : null))
  );
  userPermissions$ = new BehaviorSubject<UserPermission>(null);

  hasUserClickedLogin = false;

  constructor(
    private store$: Store<AppState>,
    private authDataService: AuthDataService,
    private router: Router,
    private ngZone: NgZone,
    private localStorageService: LocalStorageService,
    @Inject(ENV) private environment: Environment
  ) {}

  initializeGoogleSignInButton(btnRef: ElementRef): void {
    this.initializeGoogleSignIn();
    this.renderGoogleSignInButton(btnRef);
  }

  // make these dispatchable effects?

  initializeUserSession(): void {
    const currentUser: User = this.localStorageService.getItem('currentUser');

    if (currentUser) {
      this.handleAutomaticLogin(currentUser);
    } else {
      console.log('do login, no user:', currentUser);
      this.router.navigateByUrl('/login');
    }
  }

  removeStoredUser() {
    this.localStorageService.removeItem('currentUser');
  }

  handleAutomaticLogin(currentUser: User): void {
    console.log('dont do login:', currentUser);

    this.store$.dispatch(AuthActions.actionSetIsLoggedIn({ isLoggedIn: true }));
    this.store$.dispatch(AuthActions.actionSetIsAuthenticating({ isAuthenticating: false }));
    this.doLogin(currentUser, currentUser.token);
    this.store$.dispatch(AuthActions.actionSetUserInfo({ user: currentUser }));
  }

  initializeGoogleSignIn(): void {
    const initConfig: google.accounts.id.IdConfiguration = {
      client_id: this.environment.gapiClientId,
      ux_mode: 'popup',
      callback: (response: google.accounts.id.CredentialResponse) => {
        this.onAuthedUserFetchSuccess(response);
      },
    };
    google.accounts.id.initialize(initConfig);
  }

  renderGoogleSignInButton(btnRef: ElementRef): void {
    const buttonConfig: google.accounts.id.GsiButtonConfiguration = {
      theme: 'filled_blue',
      width: '300',
      type: 'standard',
      click_listener: () => this.authLoginStart(),
    };
    google.accounts.id.renderButton(btnRef.nativeElement, buttonConfig);
  }

  // *************************************

  decodeJWT(googleIdCredentialResponse: google.accounts.id.CredentialResponse): JwtPayload {
    // put some error handling in here if cred has unexpected data
    console.log('googleIdCredResponse:', googleIdCredentialResponse);
    // this type might not be quite right, doesn't match all of Google JWT
    const result = jwt_decode<JwtPayload>(googleIdCredentialResponse.credential);
    console.log('decodedJWTPayload:', result);
    return result;
  }

  onAuthedUserFetchSuccess = (googleIdCredentialResponse: google.accounts.id.CredentialResponse) => {
    this.hasUserClickedLogin = true;
    this.ngZone.run(() => this.handleGoogleAuthClickInNgZone(googleIdCredentialResponse));
  };

  onAuthedUserFetchError = (error) => {
    console.log(JSON.stringify(error, undefined, 2));
    this.store$.dispatch(AuthActions.actionLoginFailure());
  };

  handleGoogleAuthClickInNgZone = (googleIdCredentialResponse: google.accounts.id.CredentialResponse) => {
    const payload: any = this.decodeJWT(googleIdCredentialResponse);

    const user = {
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      imageUrl: payload.picture,
      localTimeZone: '',
    };

    const token = payload.sub;

    // Store the token in the ngrx store as this is being passed in every request via http interceptor
    this.store$.dispatch(AuthActions.actionSetUserInfo({ user: { token } as User }));
    this.doLogin(user, token);
  };

  doLogin = (user, token: string): void => {
    this.authDataService
      .login(user)
      .pipe(
        tap((res: User) => {
          this.hasUserClickedLogin = false;
          this.store$.dispatch(AuthActions.actionLoginSuccess());
          this.deferSetUserInfoAfterNavigateEnd(res, token);
        }),
        catchError(() => [this.store$.dispatch(AuthActions.actionLoginFailure())])
      )
      .subscribe();
  };

  setUserInBrowserStorage(user: User): void {
    this.localStorageService.setItem('currentUser', user);
  }

  // wait after google auth login navs back to app on success to dispatch data fetches
  deferSetUserInfoAfterNavigateEnd(res: User, token: string): void {
    let hasFired = false;
    this.router.events.pipe().subscribe((event) => {
      if (!hasFired && event instanceof NavigationEnd) {
        hasFired = true;
        this.store$.dispatch(AuthActions.actionSetUserInfo({ user: { ...res, token } }));
      }
    });
  }

  setUserSettingsWithRole(user: any, actions: Action[]) {
    this.setUserInBrowserStorage(user);
    this.setUserPermissions(user.role);
    return [AuthActions.actionSetUserInfoSuccess({ user }), ...actions];
  }

  trySetUserSettingWithEmail(user: any, actions: Action[]) {
    this.authDataService.getUserByEmail(user.email).pipe(
      switchMap((res: User) => {
        if (res[0]) {
          // Avoid null name in account
          if (res[0].firstName) {
            this.setUserPermissions(res[0].role);
            this.setUserInBrowserStorage(user);
            return [AuthActions.actionSetUserInfoSuccess({ user: { ...res[0], token: user.token } }), ...actions];
          } else {
            return [AuthActions.actionLogoutStart()];
          }
        } else {
          return [AuthActions.actionSetUserInfoFailed()];
        }
      })
    );
  }

  authLoginStart() {
    this.store$.dispatch(AuthActions.actionLoginStart());
  }

  authLogout() {
    this.store$.dispatch(AuthActions.actionLogoutStart());
  }

  initializeGapi() {
    this.store$.dispatch(AuthActions.actionInitializeGapi());
  }

  setRedirectionUrl(redirectUrl: string) {
    this.store$.dispatch(AuthActions.actionSetRedirectUrl({ redirectUrl }));
  }

  setUserPermissions(role: UserRole) {
    switch (role) {
      // Permissions for managing queries will be same as experiments
      case UserRole.ADMIN:
        this.userPermissions$.next({
          experiments: { create: true, read: true, update: true, delete: true },
          users: { create: true, read: true, update: true, delete: true },
          logs: { create: true, read: true, update: true, delete: true },
          manageRoles: { create: true, read: true, update: true, delete: true },
          featureFlags: { create: true, read: true, update: true, delete: true },
          metrics: { create: true, read: true, update: true, delete: true },
          segments: { create: true, read: true, update: true, delete: true },
        });
        break;
      case UserRole.CREATOR:
        this.userPermissions$.next({
          experiments: { create: true, read: true, update: true, delete: true },
          users: { create: true, read: true, update: true, delete: true },
          logs: { create: false, read: true, update: false, delete: false },
          manageRoles: { create: false, read: true, update: false, delete: false },
          featureFlags: { create: true, read: true, update: true, delete: true },
          metrics: { create: true, read: true, update: true, delete: true },
          segments: { create: true, read: true, update: true, delete: true },
        });
        break;
      case UserRole.USER_MANAGER:
        this.userPermissions$.next({
          experiments: { create: false, read: true, update: false, delete: false },
          users: { create: true, read: true, update: true, delete: true },
          logs: { create: false, read: true, update: false, delete: false },
          manageRoles: { create: false, read: true, update: false, delete: false },
          featureFlags: { create: false, read: true, update: false, delete: false },
          metrics: { create: false, read: true, update: false, delete: false },
          segments: { create: false, read: true, update: false, delete: false },
        });
        break;
      case UserRole.READER:
        this.userPermissions$.next({
          experiments: { create: false, read: true, update: false, delete: false },
          users: { create: false, read: true, update: false, delete: false },
          logs: { create: false, read: true, update: false, delete: false },
          manageRoles: { create: false, read: true, update: false, delete: false },
          featureFlags: { create: false, read: true, update: false, delete: false },
          metrics: { create: false, read: true, update: false, delete: false },
          segments: { create: false, read: true, update: false, delete: false },
        });
        break;
    }
  }
}
