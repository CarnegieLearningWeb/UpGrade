import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as experimentUsersActions from './store/experiment-users.actions';
import { selectAllEntities, selectIsExcludedEntityLoading } from './store/experiment-users.selectors';
import { map } from 'rxjs/operators';

@Injectable()
export class ExperimentUsersService {
  allExcludedEntities$ = this.store$.pipe(
    select(selectAllEntities),
    map((entities) => entities.sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0)))
  );
  isExcludedEntityLoading$ = this.store$.pipe(select(selectIsExcludedEntityLoading));
  constructor(private store$: Store<AppState>) {}

  fetchExcludedUsers() {
    this.store$.dispatch(experimentUsersActions.actionFetchExcludedUsers());
  }

  fetchExcludedGroups() {
    this.store$.dispatch(experimentUsersActions.actionFetchExcludedGroups());
  }

  excludeUser(id: string) {
    this.store$.dispatch(experimentUsersActions.actionExcludeUser({ id }));
  }

  excludeGroup(id: string, groupType: string) {
    this.store$.dispatch(experimentUsersActions.actionExcludeGroup({ id, groupType }));
  }

  deleteExcludedUser(id: string) {
    this.store$.dispatch(experimentUsersActions.actionDeleteExcludedUser({ id }));
  }

  deleteExcludedGroup(id: string, groupType: string) {
    this.store$.dispatch(experimentUsersActions.actionDeleteExcludedGroup({ id, groupType }));
  }
}
