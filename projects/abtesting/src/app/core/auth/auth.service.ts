import { Injectable } from '@angular/core';
import { AppState } from '../core.module';
import { Store } from '@ngrx/store';
import * as AuthActions from './store/auth.actions';

@Injectable()
export class AuthService {

  constructor(private store$: Store<AppState>) {}

  authLogin() {
    this.store$.dispatch(AuthActions.authLogin());
  }

  authLogout() {
    this.store$.dispatch(AuthActions.authLogout());
  }
}
