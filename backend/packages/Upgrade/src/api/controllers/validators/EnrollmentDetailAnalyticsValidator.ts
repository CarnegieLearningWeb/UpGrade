import { IsString } from 'class-validator';

export class EnrollmentDetailAnalyticsValidator {
  @IsString()
  public experimentId: string;
}
