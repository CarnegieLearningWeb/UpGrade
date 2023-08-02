import { Type } from 'class-transformer';
import { IsNotEmpty, IsDefined, IsNumber, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { EXPERIMENT_SORT_AS } from 'upgrade_types';

export enum USER_SEARCH_SORT_KEY {
  ALL = 'all',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  ROLE = 'role',
}

export class UserSortParamsValidator {
  @IsNotEmpty()
  @IsEnum(USER_SEARCH_SORT_KEY)
  key: USER_SEARCH_SORT_KEY;

  @IsNotEmpty()
  @IsEnum(EXPERIMENT_SORT_AS)
  sortAs: EXPERIMENT_SORT_AS;
}

export class UserSearchParamsValidator {
  @IsNotEmpty()
  @IsEnum(USER_SEARCH_SORT_KEY)
  key: USER_SEARCH_SORT_KEY;

  @IsNotEmpty()
  @IsString()
  string: string;
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

  @IsOptional()
  @ValidateNested()
  @Type(() => UserSearchParamsValidator)
  public searchParams?: UserSearchParamsValidator;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserSortParamsValidator)
  public sortParams?: UserSortParamsValidator;
}
