import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';

export enum EntityTypes {
  GROUP_ID = 'Group ID',
  PARTICIPANT_ID = 'Participant ID',
}

export interface ExcludeEntity {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  userId?: string;
  groupId?: string;
  type?: string;
}

export interface ExperimentUsersState extends EntityState<ExcludeEntity> {
  isLoading: boolean;
}

export interface State extends AppState {
  experimentUsers: ExperimentUsersState;
}
