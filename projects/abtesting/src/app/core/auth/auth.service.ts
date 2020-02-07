import { Injectable } from '@angular/core';
import { AppState } from '../core.module';
import { Store, select } from '@ngrx/store';
import * as AuthActions from './store/auth.actions';
import { selectIsLoggedIn, selectIsAuthenticating, selectCurrentUser } from './store/auth.selectors';
import { filter, map } from 'rxjs/operators';

@Injectable()
export class AuthService {

  constructor(private store$: Store<AppState>) {}

  isLoggedIn$ = this.store$.pipe(select(selectIsLoggedIn));
  isAuthenticating$ = this.store$.pipe(select(selectIsAuthenticating));
  currentUser$ = this.store$.pipe(select(selectCurrentUser));
  getIdToken$ = this.store$.pipe(
    select(selectCurrentUser),
    filter(currentUser => !!currentUser),
    map(currentUser => currentUser['token'])
  )

  authLoginStart() {
    this.store$.dispatch(AuthActions.actionLoginStart());
  }

  authLogout() {
    this.store$.dispatch(AuthActions.actionLogoutStart());
  }

  initializeGapi() {
    this.store$.dispatch(AuthActions.actionInitializeGapi());
  }

  attachSignIn(element) {
    this.store$.dispatch(AuthActions.actionBindAttachHandlerWithButton({ element }));
  }

  setRedirectionUrl(redirectUrl: string) {
    this.store$.dispatch(AuthActions.actionSetRedirectUrl({ redirectUrl }));
  }
}
