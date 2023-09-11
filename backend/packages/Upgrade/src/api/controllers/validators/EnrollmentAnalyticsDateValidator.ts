import { IsString, IsEnum, IsNumber, IsNotEmpty } from 'class-validator';
import { DATE_RANGE } from 'upgrade_types';

export class EnrollmentAnalyticsDateValidator {
  @IsNotEmpty()
  @IsString()
  public experimentId: string;

  @IsNotEmpty()
  @IsEnum(DATE_RANGE)
  public dateEnum: DATE_RANGE;

  @IsNotEmpty()
  @IsNumber()
  public clientOffset: number;
}
