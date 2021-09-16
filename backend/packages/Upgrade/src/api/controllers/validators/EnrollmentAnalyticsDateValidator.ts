import { IsString, IsEnum, IsNumber } from 'class-validator';
import { DATE_RANGE } from 'upgrade_types';

export class EnrollmentAnalyticsDateValidator {
  @IsString()
  public experimentId: string;

  @IsEnum(DATE_RANGE)
  public dateEnum: DATE_RANGE;

  @IsNumber()
  public clientOffset: number;
}
