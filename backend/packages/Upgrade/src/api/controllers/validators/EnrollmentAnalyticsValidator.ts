import { IsString } from 'class-validator';

export class EnrollmentAnalyticsValidator {
  @IsString({ each: true })
  public experimentIds: string[];
}
