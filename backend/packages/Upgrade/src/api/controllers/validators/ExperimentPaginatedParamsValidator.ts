import { IsNotEmpty, IsDefined, IsNumber, IsEnum, IsString, ValidateNested, IsOptional } from 'class-validator';
import { EXPERIMENT_SEARCH_KEY, EXPERIMENT_SORT_AS, EXPERIMENT_SORT_KEY } from '../../models/Experiment';
import { Type } from 'class-transformer';

class ExperimentSearchParam {
  @IsOptional()
  @IsEnum(EXPERIMENT_SEARCH_KEY)
  public key: EXPERIMENT_SEARCH_KEY;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public string: string
}

class ExperimentSortParam {
  @IsNotEmpty()
  @IsEnum(EXPERIMENT_SORT_KEY)
  public key: EXPERIMENT_SORT_KEY;

  @IsNotEmpty()
  @IsEnum(EXPERIMENT_SORT_AS)
  public sortAs: EXPERIMENT_SORT_AS;
}

export class ExperimentPaginatedParamsValidator {
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
  @Type(() => ExperimentSearchParam)
  public searchParams?: ExperimentSearchParam;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExperimentSortParam)
  public sortParams?: ExperimentSortParam;
}
