import { IsNotEmpty, IsString } from 'class-validator';
import { IsWorkingGroupRecord } from './ExperimentUserValidator';
export class UpdateWorkingGroupValidator {
  @IsString()
  @IsNotEmpty()
  public id: string;

  @IsWorkingGroupRecord()
  @IsNotEmpty()
  public workingGroup: Record<string, string>;
}

export class UpdateWorkingGroupValidatorv6 {
  @IsWorkingGroupRecord()
  @IsNotEmpty()
  public workingGroup: Record<string, string>;
}
