import { IsNotEmpty, IsDefined, IsNumber } from 'class-validator';
import { SORT_AS } from 'packages/Upgrade/src/types';

// TODO: Move to upgrade types
export interface IUserSearchParams {
  key: USER_SEARCH_SORT_KEY;
  string: string;
}
export interface IUserSortParams {
  key: USER_SEARCH_SORT_KEY;
  sortAs: SORT_AS;
}

export enum USER_SEARCH_SORT_KEY {
  ALL = 'all',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  ROLE = 'role',
}

export class UserPaginatedParamsValidator {
  @IsNotEmpty()
  @IsNumber()
  @IsDefined()
  public skip: number;

  @IsNotEmpty()
  @IsNumber()
  @IsDefined()
  public take: number;

  public searchParams: IUserSearchParams;

  public sortParams: IUserSortParams;
}
