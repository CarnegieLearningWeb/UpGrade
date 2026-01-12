import { ElementRef, Inject, Injectable, NgZone } from '@angular/core';
import { AppState, LocalStorageService } from '../core.module';
import { Store, select, Action } from '@ngrx/store';
import * as AuthActions from './store/auth.actions';
import { DOCUMENT } from '@angular/common';
import {
  selectIsLoggedIn,
  selectIsAuthenticating,
  selectCurrentUser,
  selectGoogleCredential,
  selectUserIsAdmin,
  selectUserIsReader,
} from './store/auth.selectors';
import { UserPermission } from './store/auth.models';
import { BehaviorSubject, filter, take } from 'rxjs';
import { AUTH_CONSTANTS, GoogleAuthJWTPayload, User, UserRole } from '../users/store/users.model';
import { ENV, Environment } from '../../../environments/environment-types';
import jwt_decode from 'jwt-decode';
import { NavigationEnd, NavigationSkipped, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

@Injectable()
export class AuthService {
  isLoggedIn$ = this.store$.pipe(select(selectIsLoggedIn));
  isAuthenticating$ = this.store$.pipe(select(selectIsAuthenticating));
  isUserAdmin$ = this.store$.pipe(select(selectUserIsAdmin));
  isUserReader$ = this.store$.pipe(select(selectUserIsReader));
  currentUser$ = this.store$.pipe(select(selectCurrentUser));
  getGoogleCredential$ = this.store$.pipe(select(selectGoogleCredential));
  userPermissions$ = new BehaviorSubject<UserPermission>(null);

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private localStorageService: LocalStorageService,
    @Inject(ENV) private environment: Environment,
    @Inject(DOCUMENT) private DOMref: Document
  ) {}

  initializeUserSession(): void {
    const currentUser = this.getUserFromBrowserStorage();
    this.determinePostLoginDestinationUrl();

    if (currentUser) {
      this.handleAutomaticLogin(currentUser);
    } else {
      this.authLogout();
    }
  }

  /**
   * determinePostLoginDestinationUrl
   *
   * - navigate to /home if user started from login or if no path is present
   * - otherwise, navigate to the path they started from after google login does its thing
   */

  determinePostLoginDestinationUrl(): void {
    let originalDestinationUrl: string;

    if (this.DOMref.location.href.endsWith('login')) {
      originalDestinationUrl = 'home';
    } else {
      originalDestinationUrl = this.environment.useHashRouting
        ? this.DOMref.location.hash.substring(1) || 'home'
        : this.DOMref.location.pathname;
    }

    this.setRedirectionUrl(originalDestinationUrl);
  }

  initializeGoogleSignInButton(btnRef: ElementRef): void {
    this.initializeGoogleSignIn();
    this.renderGoogleSignInButton(btnRef);
  }

  handleAutomaticLogin(user: User): void {
    this.store$.dispatch(AuthActions.actionSetIsLoggedIn({ isLoggedIn: true }));
    this.store$.dispatch(AuthActions.actionSetIsAuthenticating({ isAuthenticating: false }));
    this.store$.dispatch(AuthActions.actionSetGoogleCredential({ googleCredential: user.token }));
    this.store$.dispatch(AuthActions.actionSetUserInfo({ user }));
    this.store$.dispatch(AuthActions.actionLoginStart({ user, googleCredential: user.token }));
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
    this.store$.dispatch(AuthActions.actionLoginStart({ user, googleCredential }));
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
  // we want to simply wait until we receive NavigationEnd or NavigationSkipped (when the redirectUrl is the same as the current url)
  // then we once want to fire this one time to fetch the authed user data in db per permissions and complete the sub, so we use take(1)
  deferFetchUserExperimentDataAfterNavigationEnd(user: User, googleCredential: string): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd || event instanceof NavigationSkipped),
        take(1)
      )
      .subscribe(() => {
        this.store$.dispatch(AuthActions.actionFetchUserExperimentData({ user: { ...user, token: googleCredential } }));
      });
  }

  setUserSettingsWithRole(user: User, actions: Action[]): Action[] {
    this.setUserInBrowserStorage(user);
    this.setUserPermissions(user.role);
    return [AuthActions.actionSetUserInfoSuccess({ user }), ...actions];
  }

  authLoginStart(): void {
    this.store$.dispatch(AuthActions.actionLoginStart({ user: null, googleCredential: null }));
  }

  authLogout(): void {
    this.store$.dispatch(AuthActions.actionLogoutStart());
    this.dialog.closeAll();
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
          stratifications: { create: true, read: true, update: true, delete: true },
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
          stratifications: { create: true, read: true, update: true, delete: true },
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
          stratifications: { create: false, read: true, update: false, delete: false },
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
          stratifications: { create: false, read: true, update: false, delete: false },
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
