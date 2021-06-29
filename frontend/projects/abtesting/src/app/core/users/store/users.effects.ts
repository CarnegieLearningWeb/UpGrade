import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import * as UsersActions from './users.actions';
import { UsersDataService } from '../users.data.service';
import { switchMap, map, catchError, filter, withLatestFrom, tap, first } from 'rxjs/operators';
import { User, UserRole, NUMBER_OF_USERS } from './users.model';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.state';
import { selectCurrentUser } from '../../auth/store/auth.selectors';
import { selectTotalUsers, selectSkipUsers, selectSearchKey, selectSortKey, selectSortAs, selectSearchString } from './users.selectors';
import { combineLatest } from 'rxjs';

@Injectable()
export class UsersEffects {
  constructor(private actions$: Actions, private usersDataService: UsersDataService, private store$: Store<AppState>) {}

  fetchUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.actionFetchUsers),
      map(action => action.fromStarting),
      withLatestFrom(
        this.store$.pipe(select(selectCurrentUser)),
        this.store$.pipe(select(selectSkipUsers)),
        this.store$.pipe(select(selectTotalUsers)),
        this.store$.pipe(select(selectSearchKey)),
        this.store$.pipe(select(selectSortKey)),
      ),
      filter(([fromStarting, user, skip, total]) => {
        return !!user && user.role === UserRole.ADMIN && (skip < total || total === null || fromStarting);
      }),
      tap(() => {
        this.store$.dispatch(UsersActions.actionSetIsUserLoading({ isUsersLoading: true }));
      }),
      switchMap(([fromStarting, _, skip, total, searchKey, sortKey]) => {
        let sortAs = null;
        let searchString = null;

        // As withLatestFrom does not support more than 5 arguments
        // TODO: Find alternative
        this.getSearchString$().subscribe(data => {
          searchString = data.searchString;
          sortAs = data.sortAs
        });
        let params: any = {
          skip: fromStarting ? 0 : skip,
          take: NUMBER_OF_USERS
        }
        if (sortKey) {
          params = {
            ...params,
            sortParams: {
              key: sortKey,
              sortAs
            }
          };
        }
        if (searchString) {
          params = {
            ...params,
            searchParams: {
              key: searchKey,
              string: searchString
            }
          };
        }
        return this.usersDataService.fetchUsers(params).pipe(
          switchMap((data: any) => {
            const actions = fromStarting ? [UsersActions.actionSetSkipUsers({ skipUsers: 0 })] : [];
            return [
              ...actions,
              UsersActions.actionFetchUsersSuccess({ users: data.nodes, totalUsers: data.total })
            ]
          }),
          catchError(() => [UsersActions.actionFetchUsersFailure()])
        )
      }
      )
    )
  );

  updateUserRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.actionUpdateUserRole),
      map(action => action.userRoleData),
      filter(({ email, role }) => !!email && !!role),
      switchMap(({ email, role }) =>
        this.usersDataService.updateUserRole(email, role).pipe(
          map((data: User) => UsersActions.actionUpdateUserRoleSuccess({ user: data[0] })),
          catchError(() => [UsersActions.actionUpdateUserRoleFailure()])
        )
      )
    )
  );

  createNewUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.actionCreateNewUser),
      map(action => action.user),
      filter(({ email, role }) => !!email && !!role),
      switchMap(({ email, role }) => {
        return this.usersDataService.createNewUser(email, role).pipe(
          map((data: User) => UsersActions.actionCreateNewUserSuccess({ user: data })),
          catchError(() => [UsersActions.actionCreateNewUserFailure()])
        );
      })
    )
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.actionDeleteUser),
      map(action => action.email),
      filter(( email ) => !!email ),
      switchMap(( email ) => this.usersDataService.deleteUser(email).pipe(
          map((data: User[]) => UsersActions.actionDeleteUserSuccess({ user: data[0] })),
          catchError(() => [UsersActions.actionDeleteUserFailure()])
      ))
    ),
  );

  fetchUsersOnSearchString$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UsersActions.actionSetSearchString),
        map(action => action.searchString),
        tap(searchString => {
          // Allow empty string as we erasing text from search input
          if (searchString !== null) {
            this.store$.dispatch(UsersActions.actionFetchUsers({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  fetchUsersOnSearchKeyChange$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UsersActions.actionSetSearchKey),
        withLatestFrom(this.store$.pipe(select(selectSearchString))),
        tap(([_, searchString]) => {
          if (searchString) {
            this.store$.dispatch(UsersActions.actionFetchUsers({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  private getSearchString$ = () =>
    combineLatest(
      this.store$.pipe(select(selectSearchString)),
      this.store$.pipe(select(selectSortAs)),

    ).pipe(
      map(([searchString, sortAs]) => ({ searchString, sortAs })),
      first()
    );
}
