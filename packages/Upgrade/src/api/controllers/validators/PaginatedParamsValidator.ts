import { IsNotEmpty, IsDefined, IsNumber } from 'class-validator';
import { IExperimentSearchParams, IExperimentSortParams } from '../../models/Experiment';

export class PaginatedParamsValidator {
  @IsNotEmpty()
  @IsNumber()
  @IsDefined()
  public skip: number;

  @IsNotEmpty()
  @IsNumber()
  @IsDefined()
  public take: number;

  public searchParams: IExperimentSearchParams;

  public sortParams: IExperimentSortParams;
}
