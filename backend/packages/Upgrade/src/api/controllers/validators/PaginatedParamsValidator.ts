import { Type } from 'class-transformer';
import { IsNotEmpty, IsDefined, IsNumber, IsString, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { EXPERIMENT_SORT_AS } from 'upgrade_types';
class SortParamsValidator {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsEnum(EXPERIMENT_SORT_AS)
  sortAs: EXPERIMENT_SORT_AS;
}

class SearchParamsValidator {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  string: string;
}
export class PaginatedParamsValidator {
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
  @Type(() => SearchParamsValidator)
  public searchParams: SearchParamsValidator;

  @IsOptional()
  @ValidateNested()
  @Type(() => SortParamsValidator)
  public sortParams: SortParamsValidator;
}
