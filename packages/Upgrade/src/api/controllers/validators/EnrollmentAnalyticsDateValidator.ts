import { IsString, IsDate } from 'class-validator';

export class EnrollmentAnalyticsDateValidator {
  @IsString()
  public experimentId: string;

  @IsDate()
  public fromDate: Date;

  @IsDate()
  public toDate: Date;
}
