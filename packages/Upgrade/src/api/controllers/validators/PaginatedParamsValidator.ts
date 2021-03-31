import { IsNotEmpty, IsDefined, IsNumber } from 'class-validator';
import { SORT_AS } from 'packages/Upgrade/src/types';

export class PaginatedParamsValidator {
  @IsNotEmpty()
  @IsNumber()
  @IsDefined()
  public skip: number;

  @IsNotEmpty()
  @IsNumber()
  @IsDefined()
  public take: number;

  public searchParams: { key: string, string: string };

  public sortParams: { key: string, sortAs: SORT_AS };
}
