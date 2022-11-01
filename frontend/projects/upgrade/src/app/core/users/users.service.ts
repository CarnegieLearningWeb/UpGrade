import { Injectable } from '@angular/core';
import { AppState } from '../core.state';
import { Store, select } from '@ngrx/store';
import { selectIsUsersLoading, selectAllUsers, selectSkipUsers, selectTotalUsers } from './store/users.selectors';
import * as UsersActions from './store/users.actions';
import { UserRole, USER_SEARCH_SORT_KEY, SORT_AS } from './store/users.model';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class UsersService {
  constructor(private store$: Store<AppState>) {}

  isUsersLoading$ = this.store$.pipe(select(selectIsUsersLoading));
  allUsers$ = this.store$.pipe(
    select(selectAllUsers),
    map((users) =>
      users.sort((a, b) => {
        const d1 = new Date(a.createdAt);
        const d2 = new Date(b.createdAt);
        return d1 < d2 ? 1 : d1 > d2 ? -1 : 0;
      })
    )
  );

  fetchUsers(fromStarting?: boolean) {
    this.store$.dispatch(UsersActions.actionFetchUsers({ fromStarting }));
  }

  updateUserDetails(firstName: string, lastName: string, email: string, role: UserRole) {
    this.store$.dispatch(
      UsersActions.actionUpdateUserDetails({ userDetailsData: { firstName, lastName, email, role } })
    );
  }

  createNewUser(firstName: string, lastName: string, email: string, role: UserRole) {
    this.store$.dispatch(UsersActions.actionCreateNewUser({ user: { firstName, lastName, email, role } }));
  }

  deleteUser(email: string) {
    this.store$.dispatch(UsersActions.actionDeleteUser({ email }));
  }

  isAllUsersFetched() {
    return combineLatest([this.store$.pipe(select(selectSkipUsers)), this.store$.pipe(select(selectTotalUsers))]).pipe(
      map(([skipUsers, totalUsers]) => skipUsers === totalUsers)
    );
  }

  setSearchKey(searchKey: USER_SEARCH_SORT_KEY) {
    this.store$.dispatch(UsersActions.actionSetSearchKey({ searchKey }));
  }

  setSearchString(searchString: string) {
    this.store$.dispatch(UsersActions.actionSetSearchString({ searchString }));
  }

  setSortKey(sortKey: USER_SEARCH_SORT_KEY) {
    this.store$.dispatch(UsersActions.actionSetSortKey({ sortKey }));
  }

  setSortingType(sortingType: SORT_AS) {
    this.store$.dispatch(UsersActions.actionSetSortingType({ sortingType }));
  }
}
