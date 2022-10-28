import { ElementRef, Injectable } from '@angular/core';
import { AppState } from '../core.module';
import { Store, select } from '@ngrx/store';
import * as AuthActions from './store/auth.actions';
import { selectIsLoggedIn, selectIsAuthenticating, selectCurrentUser } from './store/auth.selectors';
import { map } from 'rxjs/operators';
import { UserPermission } from './store/auth.models';
import { BehaviorSubject } from 'rxjs';
import { UserRole } from '../users/store/users.model';

@Injectable()
export class AuthService {

  constructor(private store$: Store<AppState>) { }

  isLoggedIn$ = this.store$.pipe(select(selectIsLoggedIn));
  isAuthenticating$ = this.store$.pipe(select(selectIsAuthenticating));
  currentUser$ = this.store$.pipe(select(selectCurrentUser));
  getIdToken$ = this.store$.pipe(
    select(selectCurrentUser),
    map(currentUser => currentUser ? currentUser.token : null)
  )
  userPermissions$ = new BehaviorSubject<UserPermission>(null);
  googleSignInElementRef: ElementRef;

  setSignInButtonElement(element: ElementRef) {
    this.googleSignInElementRef = element;
  }

  getGoogleSignInElementRef(): ElementRef {
    return this.googleSignInElementRef
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

  attachSignIn(btn: ElementRef) {
    this.setSignInButtonElement(btn);
    this.store$.dispatch(AuthActions.actionBindAttachHandlerWithButton());
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
