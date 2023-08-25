import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class EnrollmentAnalyticsValidator {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  public experimentIds: string[];
}
