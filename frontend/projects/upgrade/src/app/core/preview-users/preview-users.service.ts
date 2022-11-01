import { Injectable } from '@angular/core';
import { AppState } from '../core.state';
import { Store, select } from '@ngrx/store';
import * as previewUsersActions from './store/preview-users.actions';
import {
  selectIsPreviewUserLoading,
  selectAllPreviewUsers,
  selectSkipPreviewUsers,
  selectTotalPreviewUsers,
} from './store/preview-users.selectors';
import { map } from 'rxjs/operators';
import { PreviewUserAssignCondition } from './store/preview-users.model';
import { combineLatest } from 'rxjs';

@Injectable()
export class PreviewUsersService {
  isPreviewUserLoading$ = this.store$.pipe(select(selectIsPreviewUserLoading));
  allPreviewUsers$ = this.store$.pipe(
    select(selectAllPreviewUsers),
    map((entities) => entities.sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0)))
  );
  constructor(private store$: Store<AppState>) {}

  isAllPreviewUsersFetched() {
    return combineLatest([
      this.store$.pipe(select(selectSkipPreviewUsers)),
      this.store$.pipe(select(selectTotalPreviewUsers)),
    ]).pipe(map(([skipPreviewUsers, totalPreviewUsers]) => skipPreviewUsers === totalPreviewUsers));
  }

  fetchPreviewUsers(fromStarting?: boolean) {
    this.store$.dispatch(previewUsersActions.actionFetchPreviewUsers({ fromStarting }));
  }

  addPreviewUser(id: string) {
    this.store$.dispatch(previewUsersActions.actionAddPreviewUser({ id }));
  }

  deletePreviewUser(id: string) {
    this.store$.dispatch(previewUsersActions.actionDeletePreviewUser({ id }));
  }

  assignConditionForPreviewUser(data: PreviewUserAssignCondition) {
    this.store$.dispatch(previewUsersActions.actionAssignConditionToPreviewUser({ data }));
  }
}
