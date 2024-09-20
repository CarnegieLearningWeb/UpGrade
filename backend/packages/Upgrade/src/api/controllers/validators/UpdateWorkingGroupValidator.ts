import { IsNotEmpty, IsString } from 'class-validator';
import { IsWorkingGroupRecord } from './ExperimentUserValidator';

export class UpdateWorkingGroupValidatorv6 {
  @IsWorkingGroupRecord()
  @IsNotEmpty()
  public workingGroup: Record<string, string>;
}

export class UpdateWorkingGroupValidator extends UpdateWorkingGroupValidatorv6 {
  @IsString()
  @IsNotEmpty()
  public id: string;
}
