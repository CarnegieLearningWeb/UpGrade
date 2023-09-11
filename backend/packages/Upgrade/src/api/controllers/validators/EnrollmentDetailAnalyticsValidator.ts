import { IsNotEmpty, IsString } from 'class-validator';

export class EnrollmentDetailAnalyticsValidator {
  @IsNotEmpty()
  @IsString()
  public experimentId: string;
}
