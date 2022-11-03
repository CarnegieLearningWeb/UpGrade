import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as previewUserActions from './preview-users.actions';
import { filter, map, switchMap, catchError, withLatestFrom, tap } from 'rxjs/operators';
import { PreviewUsersDataService } from '../preview-users.data.service';
import { PreviewUsers, NUMBER_OF_PREVIEW_USERS } from './preview-users.model';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.state';
import { selectSkipPreviewUsers, selectTotalPreviewUsers } from './preview-users.selectors';

@Injectable()
export class PreviewUsersEffects {
  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private previewUserDataService: PreviewUsersDataService
  ) {}

  fetchPaginatedPreviewUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(previewUserActions.actionFetchPreviewUsers),
      map((action) => action.fromStarting),
      withLatestFrom(
        this.store$.pipe(select(selectSkipPreviewUsers)),
        this.store$.pipe(select(selectTotalPreviewUsers))
      ),
      filter(([fromStarting, skip, total]) => skip < total || total === null || fromStarting),
      tap(() => {
        this.store$.dispatch(previewUserActions.actionSetIsPreviewUsersLoading({ isPreviewUsersLoading: true }));
      }),
      switchMap(([fromStarting, skip, total]) => {
        const params = {
          skip: fromStarting ? 0 : skip,
          take: NUMBER_OF_PREVIEW_USERS,
        };
        return this.previewUserDataService.fetchPreviewUsers(params).pipe(
          switchMap((data: any) => {
            const actions = fromStarting ? [previewUserActions.actionSetSkipPreviewUsers({ skipPreviewUsers: 0 })] : [];
            return [
              ...actions,
              previewUserActions.actionFetchPreviewUsersSuccess({ data: data.nodes, totalPreviewUsers: data.total }),
            ];
          }),
          catchError(() => [previewUserActions.actionFetchPreviewUsersFailure()])
        );
      })
    )
  );

  addPreviewUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(previewUserActions.actionAddPreviewUser),
      map((action) => ({ id: action.id })),
      filter(({ id }) => !!id),
      switchMap(({ id }) =>
        this.previewUserDataService.addPreviewUser(id).pipe(
          map((data: PreviewUsers) => previewUserActions.actionAddPreviewUserSuccess({ data })),
          catchError((error) => [previewUserActions.actionAddPreviewUserFailure()])
        )
      )
    )
  );

  deletePreviewUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(previewUserActions.actionDeletePreviewUser),
      map((action) => action.id),
      filter((id) => !!id),
      switchMap((id) =>
        this.previewUserDataService.deletePreviewUser(id).pipe(
          map((data: PreviewUsers[]) => previewUserActions.actionDeletePreviewUserSuccess({ data: data[0] })),
          catchError((error) => [previewUserActions.actionDeletePreviewUserFailure()])
        )
      )
    )
  );

  assignCondition$ = createEffect(() =>
    this.actions$.pipe(
      ofType(previewUserActions.actionAssignConditionToPreviewUser),
      map((action) => action.data),
      filter((data) => !!data),
      switchMap((data) =>
        this.previewUserDataService.assignConditionToPreviewUser(data).pipe(
          map((previewUser) => previewUserActions.actionAssignConditionToPreviewUserSuccess({ previewUser })),
          catchError(() => [previewUserActions.actionAssignConditionToPreviewUserFailure()])
        )
      )
    )
  );
}
