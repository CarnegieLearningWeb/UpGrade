import { ElementRef, Inject, Injectable, NgZone } from '@angular/core';
import { AppState, LocalStorageService } from '../core.module';
import { Store, select, Action } from '@ngrx/store';
import * as AuthActions from './store/auth.actions';
import {
  selectIsLoggedIn,
  selectIsAuthenticating,
  selectCurrentUser,
  selectGoogleCredential,
} from './store/auth.selectors';
import { catchError, map, tap } from 'rxjs/operators';
import { UserPermission } from './store/auth.models';
import { BehaviorSubject } from 'rxjs';
import { AUTH_CONSTANTS, GoogleAuthJWTPayload, User, UserRole } from '../users/store/users.model';
import { ENV, Environment } from '../../../environments/environment-types';
import jwt_decode from 'jwt-decode';
import { AuthDataService } from './auth.data.service';
import { NavigationEnd, Router } from '@angular/router';

@Injectable()
export class AuthService {
  isLoggedIn$ = this.store$.pipe(select(selectIsLoggedIn));
  isAuthenticating$ = this.store$.pipe(select(selectIsAuthenticating));
  currentUser$ = this.store$.pipe(select(selectCurrentUser));
  getGoogleCredential$ = this.store$.pipe(select(selectGoogleCredential));
  userPermissions$ = new BehaviorSubject<UserPermission>(null);

  constructor(
    private store$: Store<AppState>,
    private authDataService: AuthDataService,
    private router: Router,
    private ngZone: NgZone,
    private localStorageService: LocalStorageService,
    @Inject(ENV) private environment: Environment
  ) {}

  initializeUserSession(): void {
    const currentUser = this.getUserFromBrowserStorage();
    if (currentUser) {
      this.handleAutomaticLogin(currentUser);
    } else {
      this.authLogout();
    }
  }

  initializeGoogleSignInButton(btnRef: ElementRef): void {
    this.initializeGoogleSignIn();
    this.renderGoogleSignInButton(btnRef);
  }

  handleAutomaticLogin(currentUser: User): void {
    this.store$.dispatch(AuthActions.actionSetIsLoggedIn({ isLoggedIn: true }));
    this.store$.dispatch(AuthActions.actionSetIsAuthenticating({ isAuthenticating: false }));
    this.store$.dispatch(AuthActions.actionSetUserInfo({ user: currentUser }));
    this.doLogin(currentUser, currentUser.token);
  }

  initializeGoogleSignIn(): void {
    const initConfig: google.accounts.id.IdConfiguration = {
      client_id: this.environment.googleClientId,
      callback: (response: google.accounts.id.CredentialResponse) => {
        this.onAuthedUserFetchSuccess(response);
      },
    };
    google.accounts.id.initialize(initConfig);
  }

  renderGoogleSignInButton(btnRef: ElementRef): void {
    const buttonConfig: google.accounts.id.GsiButtonConfiguration = {
      theme: 'filled_blue',
      width: '300px',
      type: 'standard',
      click_listener: () => this.authLoginStart(),
    };
    google.accounts.id.renderButton(btnRef.nativeElement, buttonConfig);
  }

  decodeJWT(googleIdCredentialResponse: google.accounts.id.CredentialResponse): GoogleAuthJWTPayload {
    const result = jwt_decode<GoogleAuthJWTPayload>(googleIdCredentialResponse.credential);
    return result;
  }

  onAuthedUserFetchSuccess = (googleIdCredentialResponse: google.accounts.id.CredentialResponse): void => {
    this.ngZone.run(() => this.handleGoogleAuthClickInNgZone(googleIdCredentialResponse));
  };

  handleGoogleAuthClickInNgZone = (googleIdCredentialResponse: google.accounts.id.CredentialResponse): void => {
    const payload: GoogleAuthJWTPayload = this.decodeJWT(googleIdCredentialResponse);

    const user: User = {
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      imageUrl: payload.picture,
      localTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const googleCredential = googleIdCredentialResponse.credential;

    this.store$.dispatch(AuthActions.actionSetGoogleCredential({ googleCredential }));
    this.doLogin(user, googleCredential);
  };

  doLogin = (user: User, googleCredential: string): void => {
    this.authDataService
      .login(user)
      .pipe(
        tap((res: User) => {
          this.store$.dispatch(AuthActions.actionLoginSuccess());
          this.deferSetUserInfoAfterNavigateEnd(res, googleCredential);
        }),
        catchError(() => [this.store$.dispatch(AuthActions.actionLoginFailure())])
      )
      .subscribe();
  };

  setUserInBrowserStorage(user: User): void {
    this.localStorageService.setItem(AUTH_CONSTANTS.USER_STORAGE_KEY, user);
  }

  getUserFromBrowserStorage(): User {
    return this.localStorageService.getItem(AUTH_CONSTANTS.USER_STORAGE_KEY);
  }

  removeUserFromBrowserStorage(): void {
    this.localStorageService.removeItem(AUTH_CONSTANTS.USER_STORAGE_KEY);
  }

  // wait after google auth login navs back to app on success to dispatch data fetches
  deferSetUserInfoAfterNavigateEnd(res: User, googleCredential: string): void {
    let hasFired = false;
    this.router.events.pipe().subscribe((event) => {
      if (!hasFired && event instanceof NavigationEnd) {
        hasFired = true;
        this.store$.dispatch(AuthActions.actionSetUserInfo({ user: { ...res, token: googleCredential } }));
      }
    });
  }

  setUserSettingsWithRole(user: User, actions: Action[]): Action[] {
    this.setUserInBrowserStorage(user);
    this.setUserPermissions(user.role);
    return [AuthActions.actionSetUserInfoSuccess({ user }), ...actions];
  }

  authLoginStart(): void {
    this.store$.dispatch(AuthActions.actionLoginStart());
  }

  authLogout(): void {
    this.store$.dispatch(AuthActions.actionLogoutStart());
  }

  setRedirectionUrl(redirectUrl: string): void {
    this.store$.dispatch(AuthActions.actionSetRedirectUrl({ redirectUrl }));
  }

  setUserPermissions(role: UserRole): void {
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
