import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as experimentUsersActions from './experiment-users.actions';
import { ExperimentUsersDataService } from '../experiment-users.data.service';
import { switchMap, map, catchError, filter } from 'rxjs/operators';
import { ExcludeEntity } from './experiment-users.model';

@Injectable()
export class ExperimentUsersEffects {
  constructor(
    private actions$: Actions,
    private experimentUsersDataService: ExperimentUsersDataService
  ) {}

  fetchExcludedUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentUsersActions.actionFetchExcludedUsers),
      switchMap(() => this.experimentUsersDataService.fetchExcludedUsers().pipe(
        map(data => experimentUsersActions.actionFetchExcludedUsersSuccess({ data })),
        catchError(() => [experimentUsersActions.actionFetchExcludedUsersFailure()])
      ))
    )
  );

  fetchExcludedGroups$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentUsersActions.actionFetchExcludedGroups),
      switchMap(() => this.experimentUsersDataService.fetchExcludedGroups().pipe(
        map(data => experimentUsersActions.actionFetchExcludedGroupsSuccess({ data })),
        catchError(() => [experimentUsersActions.actionFetchExcludedGroupsFailure()])
      ))
    )
  );

  excludedUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentUsersActions.actionExcludeUser),
      map(action => action.id),
      filter(id => !!id),
      switchMap((id: string) => this.experimentUsersDataService.excludeUser(id).pipe(
          map(data => experimentUsersActions.actionExcludeUserSuccess({ data })),
          catchError(() => [experimentUsersActions.actionExcludedUserFailure()])
        )
      )
    )
  );

  excludedGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentUsersActions.actionExcludeGroup),
      map(action => ({ id: action.id, type: action.groupType })),
      filter(({ id, type }) => !!id && !!type),
      switchMap(({ id, type }) => this.experimentUsersDataService.excludeGroup(id, type).pipe(
          map(data => experimentUsersActions.actionExcludeGroupSuccess({ data })),
          catchError(() => [
            experimentUsersActions.actionExcludedGroupFailure()
          ])
        )
      )
    )
  );
}
