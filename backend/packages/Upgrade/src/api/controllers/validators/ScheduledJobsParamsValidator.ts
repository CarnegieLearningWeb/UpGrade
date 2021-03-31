import { IsNotEmpty, IsDefined } from 'class-validator';

export class ScheduledJobsParamsValidator {
  @IsNotEmpty()
  @IsDefined()
  public id: string;
}
