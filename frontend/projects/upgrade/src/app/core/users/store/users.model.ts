import { EntityState } from '@ngrx/entity';
import { AppState } from '../../core.state';
import { UserRole } from 'upgrade_types';

export { UserRole };

// TODO: Move to upgrade types
export enum USER_SEARCH_SORT_KEY {
  ALL = 'all',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  ROLE = 'role',
}

export enum SORT_AS {
  ASCENDING = 'ASC',
  DESCENDING = 'DESC',
}

export enum AUTH_CONSTANTS {
  USER_STORAGE_KEY = 'currentUser',
}

export interface UpdateUser {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export const NUMBER_OF_USERS = 20;

export interface User {
  createdAt?: string;
  updatedAt?: string;
  versionNumber?: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  email: string;
  token?: string;
  role?: UserRole;
  localTimeZone?: string;
}

export interface GoogleAuthJWTPayload {
  aud: string;
  email: string;
  email_verified: boolean;
  exp: number;
  family_name: string;
  given_name: string;
  hd: string;
  iat: number;
  iss: string;
  jti: string;
  name: string;
  nbf: number;
  picture: string;
  sub: string;
}

export interface UserState extends EntityState<User> {
  isUsersLoading: boolean;
  skipUsers: number;
  totalUsers: number;
  searchKey: USER_SEARCH_SORT_KEY;
  searchString: string;
  sortKey: USER_SEARCH_SORT_KEY;
  sortAs: SORT_AS;
}

export interface State extends AppState {
  users: UserState;
}
