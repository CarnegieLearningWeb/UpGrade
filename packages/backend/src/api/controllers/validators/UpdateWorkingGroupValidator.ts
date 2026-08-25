import { IsNotEmpty } from 'class-validator';
import { IsWorkingGroupRecord } from './ExperimentUserValidator';

export class UpdateWorkingGroupValidatorv6 {
  @IsWorkingGroupRecord()
  @IsNotEmpty()
  public workingGroup: Record<string, string>;
}
