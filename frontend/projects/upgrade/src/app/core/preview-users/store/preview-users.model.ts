import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';

export interface Assignments {
  experiment: {
    id: string;
  };
  experimentCondition: {
    id: string;
  };
}
export interface PreviewUserAssignCondition {
  id: string;
  assignments: Assignments[];
}
export const NUMBER_OF_PREVIEW_USERS = 20;
export interface PreviewUsers {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
}

export interface PreviewUsersState extends EntityState<PreviewUsers> {
  isLoading: boolean;
  skipPreviewUsers: number;
  totalPreviewUsers: number;
}

export interface State extends AppState {
  previewUsers: PreviewUsersState;
}
