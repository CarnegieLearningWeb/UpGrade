import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';

export interface PreviewUsers {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
  group: any
}

export interface PreviewUsersState extends EntityState<PreviewUsers> {
  isLoading: boolean;
}

export interface State extends AppState {
  previewUsers: PreviewUsersState
}
