import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, ValidateNested, IsEnum, IsString } from 'class-validator';
import { SORT_AS_DIRECTION } from 'upgrade_types';

// TODO: Move to upgrade types
export interface IFeatureFlagSearchParams {
  key: FLAG_SEARCH_KEY;
  string: string;
}
export interface IFeatureFlagSortParams {
  key: FLAG_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
}

export enum FLAG_SORT_KEY {
  NAME = 'name',
  KEY = 'key',
  STATUS = 'status',
  UPDATED_AT = 'updatedAt',
}

export enum FLAG_SEARCH_KEY {
  ALL = 'all',
  NAME = 'name',
  KEY = 'key',
  STATUS = 'status',
  TAG = 'tag',
  CONTEXT = 'context',
}

class IFeatureFlagSortParamsValidator {
  @IsNotEmpty()
  @IsEnum(FLAG_SORT_KEY)
  key: FLAG_SORT_KEY;

  @IsNotEmpty()
  @IsEnum(SORT_AS_DIRECTION)
  sortAs: SORT_AS_DIRECTION;
}

class IFeatureFlagSearchParamsValidator {
  @IsNotEmpty()
  @IsEnum(FLAG_SEARCH_KEY)
  key: FLAG_SEARCH_KEY;

  @IsNotEmpty()
  @IsString()
  string: string;
}
export class FeatureFlagPaginatedParamsValidator {
  @IsNotEmpty()
  @IsNumber()
  public skip: number;

  @IsNotEmpty()
  @IsNumber()
  public take: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => IFeatureFlagSearchParamsValidator)
  public searchParams: IFeatureFlagSearchParamsValidator;

  @IsOptional()
  @ValidateNested()
  @Type(() => IFeatureFlagSortParamsValidator)
  public sortParams: IFeatureFlagSortParamsValidator;
}
