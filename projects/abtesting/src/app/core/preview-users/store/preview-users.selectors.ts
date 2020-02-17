import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PreviewUsersState, State } from './preview-users.model';
import { selectAll } from './preview-users.reducer';

export const selectPreviewUsersState = createFeatureSelector<
  State,
  PreviewUsersState
>('previewUsers');

export const selectAllPreviewUsers = createSelector(
  selectPreviewUsersState,
  selectAll
);

export const selectIsPreviewUserLoading = createSelector(
  selectPreviewUsersState,
  state => state.isLoading
);
