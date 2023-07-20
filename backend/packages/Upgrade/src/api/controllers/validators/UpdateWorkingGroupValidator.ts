import { IsNotEmpty, IsString } from 'class-validator';
import { IsStringRecord } from './ExperimentUserValidator';
export class UpdateWorkingGroupValidator {
  @IsString()
  @IsNotEmpty()
  public id: string;

  @IsStringRecord()
  @IsNotEmpty()
  public workingGroup: any;
}
