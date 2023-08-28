import { Type } from 'class-transformer';
import { IsNotEmpty, IsDefined, IsNumber, IsOptional, ValidateNested, IsEnum, IsString } from 'class-validator';
import { EXPERIMENT_SORT_AS } from 'upgrade_types';

// TODO: Move to upgrade types
export interface IFeatureFlagSearchParams {
  key: FLAG_SEARCH_SORT_KEY;
  string: string;
}
export interface IFeatureFlagSortParams {
  key: FLAG_SEARCH_SORT_KEY;
  sortAs: EXPERIMENT_SORT_AS;
}

export enum FLAG_SEARCH_SORT_KEY {
  ALL = 'all',
  NAME = 'name',
  KEY = 'key',
  STATUS = 'status',
  VARIATION_TYPE = 'variationType',
}

class IFeatureFlagSortParamsValidator {
  @IsNotEmpty()
  @IsEnum(FLAG_SEARCH_SORT_KEY)
  key: FLAG_SEARCH_SORT_KEY;

  @IsNotEmpty()
  @IsEnum(EXPERIMENT_SORT_AS)
  sortAs: EXPERIMENT_SORT_AS;
}

class IFeatureFlagSearchParamsValidator {
  @IsNotEmpty()
  @IsEnum(FLAG_SEARCH_SORT_KEY)
  key: FLAG_SEARCH_SORT_KEY;

  @IsNotEmpty()
  @IsString()
  string: string;
}
export class FeatureFlagPaginatedParamsValidator {
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
  @Type(() => IFeatureFlagSearchParamsValidator)
  public searchParams: IFeatureFlagSearchParamsValidator;

  @IsOptional()
  @ValidateNested()
  @Type(() => IFeatureFlagSortParamsValidator)
  public sortParams: IFeatureFlagSortParamsValidator;
}
