import { Injectable } from '@angular/core';
import { AppState } from '../core.state';
import { Store, select } from '@ngrx/store';
import * as previewUsersActions from './store/preview-users.actions';
import { selectIsPreviewUserLoading, selectAllPreviewUsers } from './store/preview-users.selectors';
import { map } from 'rxjs/operators';

@Injectable()
export class PreviewUsersService {

  isPreviewUserLoading$ = this.store$.pipe(select(selectIsPreviewUserLoading));
  allPreviewUsers$ = this.store$.pipe(
    select(selectAllPreviewUsers),
    map(entities =>
      entities.sort((a, b) =>
         (a.createdAt > b.createdAt) ? -1 : ((a.createdAt < b.createdAt) ? 1 : 0)
      )
    )
  );
  constructor(private store$: Store<AppState>) {}

  addPreviewUser(id: string, group: any, workingGroup?: any) {
    this.store$.dispatch(previewUsersActions.actionAddPreviewUser({ id, group, workingGroup }));
  }

  deletePreviewUser(id: string) {
    this.store$.dispatch(previewUsersActions.actionDeletePreviewUser({ id }));
  }
}
