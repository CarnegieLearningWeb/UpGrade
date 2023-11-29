import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State, ExperimentUsersState } from './experiment-users.model';
import { selectAll } from './experiment-users.reducer';

export const selectExperimentUsersState = createFeatureSelector<ExperimentUsersState>('experimentUsers');

export const selectAllEntities = createSelector(selectExperimentUsersState, selectAll);

export const selectIsExcludedEntityLoading = createSelector(selectExperimentUsersState, (state) => state.isLoading);
