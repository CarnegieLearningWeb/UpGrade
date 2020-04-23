import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import * as UsersActions from './users.actions';
import { UsersDataService } from '../users.data.service';
import { switchMap, map, catchError, filter, withLatestFrom } from 'rxjs/operators';
import { User, UserRole } from './users.model';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.state';
import { selectCurrentUser } from '../../auth/store/auth.selectors';

@Injectable()
export class UsersEffects {
  constructor(private actions$: Actions, private usersDataService: UsersDataService, private store$: Store<AppState>) {}

  fetchUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.actionFetchUsers),
      withLatestFrom(this.store$.pipe(select(selectCurrentUser))),
      filter(([_, user]) => user.role === UserRole.ADMIN),
      switchMap(() =>
        this.usersDataService.fetchUsers().pipe(
          map((data: User[]) => UsersActions.actionFetchUsersSuccess({ users: data })),
          catchError(() => [UsersActions.actionFetchUsersFailure()])
        )
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
}
