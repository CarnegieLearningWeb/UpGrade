import { IsNotEmpty, IsDefined, IsUUID } from 'class-validator';

export class ScheduledJobsParamsValidator {
  @IsNotEmpty()
  @IsUUID()
  @IsDefined()
  public id: string;
}
