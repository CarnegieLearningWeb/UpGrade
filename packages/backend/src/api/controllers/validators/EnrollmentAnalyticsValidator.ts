import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class EnrollmentAnalyticsValidator {
  @IsNotEmpty()
  @IsArray()
  @IsUUID('all', { each: true })
  public experimentIds: string[];
}
