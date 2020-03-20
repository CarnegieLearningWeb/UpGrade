import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as previewUserActions from './preview-users.actions';
import { filter, map, switchMap, catchError } from 'rxjs/operators';
import { PreviewUsersDataService } from '../preview-users.data.service';
import { PreviewUsers } from './preview-users.model';

@Injectable()
export class PreviewUsersEffects {
  constructor(
    private actions$: Actions,
    private previewUserDataService: PreviewUsersDataService
  ) {}

  fetchPreviewUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(previewUserActions.actionFetchPreviewUsers),
      switchMap(() => this.previewUserDataService.fetchPreviewUsers().pipe(
        map((data: PreviewUsers[]) => previewUserActions.actionFetchPreviewUsersSuccess({ data })),
        catchError(() => [previewUserActions.actionFetchPreviewUsersFailure()])
      ))
    )
  );

  addPreviewUser$ = createEffect(
    () => this.actions$.pipe(
      ofType(previewUserActions.actionAddPreviewUser),
      map(action => ({ id: action.id })),
      filter(({ id }) => !!id),
      switchMap(({ id }) => this.previewUserDataService.addPreviewUser(id).pipe(
        map((data: PreviewUsers) => previewUserActions.actionAddPreviewUserSuccess({ data })),
        catchError(error => [previewUserActions.actionAddPreviewUserFailure()])
      ))
    ),
  );

  deletePreviewUser$ = createEffect(
    () => this.actions$.pipe(
      ofType(previewUserActions.actionDeletePreviewUser),
      map(action =>  action.id),
      filter((id) => !!id),
      switchMap((id) => this.previewUserDataService.deletePreviewUser(id).pipe(
        map((data: PreviewUsers[]) => previewUserActions.actionDeletePreviewUserSuccess({ data: data[0] })),
        catchError(error => [previewUserActions.actionDeletePreviewUserFailure()])
      ))
    ),
  );
}
