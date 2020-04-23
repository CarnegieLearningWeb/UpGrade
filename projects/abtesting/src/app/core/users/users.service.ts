import { Injectable } from '@angular/core';
import { AppState } from '../core.state';
import { Store, select } from '@ngrx/store';
import { selectIsUsersLoading, selectAllUsers } from './store/users.selectors';
import * as UsersActions from './store/users.actions';
import { UserRole } from './store/users.model';

@Injectable()
export class UsersService {
  constructor(
    private store$: Store<AppState>
  ) {}

  isUsersLoading$ = this.store$.pipe(select(selectIsUsersLoading));
  allUsers$ = this.store$.pipe(select(selectAllUsers));

  updateUserRole(email: string, role: UserRole) {
    this.store$.dispatch(UsersActions.actionUpdateUserRole({ userRoleData: { email, role }}))
  }

  createNewUser(email: string, role: UserRole) {
    this.store$.dispatch(UsersActions.actionCreateNewUser({ user: { email, role } }));
  }
}
