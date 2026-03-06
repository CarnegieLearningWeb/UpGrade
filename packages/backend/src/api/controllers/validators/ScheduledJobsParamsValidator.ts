import { IsNotEmpty } from 'class-validator';

export class ScheduledJobsParamsValidator {
  @IsNotEmpty()
  public id: string;
}
