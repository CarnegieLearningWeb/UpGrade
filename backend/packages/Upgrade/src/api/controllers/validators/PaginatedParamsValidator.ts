import { IsNotEmpty, IsDefined, IsNumber } from 'class-validator';
import { EXPERIMENT_SORT_AS } from 'upgrade_types';

export class PaginatedParamsValidator {
  @IsNotEmpty()
  @IsNumber()
  @IsDefined()
  public skip: number;

  @IsNotEmpty()
  @IsNumber()
  @IsDefined()
  public take: number;

  public searchParams: { key: string; string: string };

  public sortParams: { key: string; sortAs: EXPERIMENT_SORT_AS };
}
