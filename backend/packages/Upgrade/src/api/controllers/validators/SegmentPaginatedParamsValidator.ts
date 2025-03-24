import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, ValidateNested, IsEnum, IsString } from 'class-validator';
import { SORT_AS_DIRECTION } from 'upgrade_types';

// TODO: Move to upgrade types
export interface ISegmentSearchParams {
  key: SEGMENT_SEARCH_KEY;
  string: string;
}
export interface ISegmentSortParams {
  key: SEGMENT_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
}

export enum SEGMENT_SORT_KEY {
  NAME = 'name',
  LAST_UPDATE = 'updatedAt',
}

export enum SEGMENT_SEARCH_KEY {
  ALL = 'all',
  NAME = 'name',
  TAG = 'tag',
  CONTEXT = 'context',
}

class ISegmentSortParamsValidator {
  @IsNotEmpty()
  @IsEnum(SEGMENT_SORT_KEY)
  key: SEGMENT_SORT_KEY;

  @IsNotEmpty()
  @IsEnum(SORT_AS_DIRECTION)
  sortAs: SORT_AS_DIRECTION;
}

class ISegmentSearchParamsValidator {
  @IsNotEmpty()
  @IsEnum(SEGMENT_SEARCH_KEY)
  key: SEGMENT_SEARCH_KEY;

  @IsNotEmpty()
  @IsString()
  string: string;
}
export class SegmentPaginatedParamsValidator {
  @IsNotEmpty()
  @IsNumber()
  public skip: number;

  @IsNotEmpty()
  @IsNumber()
  public take: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ISegmentSearchParamsValidator)
  public searchParams?: ISegmentSearchParamsValidator;

  @IsOptional()
  @ValidateNested()
  @Type(() => ISegmentSortParamsValidator)
  public sortParams?: ISegmentSortParamsValidator;
}
