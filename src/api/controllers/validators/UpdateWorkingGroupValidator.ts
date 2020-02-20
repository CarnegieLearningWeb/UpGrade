import { IsNotEmpty, IsString } from 'class-validator';
export class UpdateWorkingGroupValidator {
  @IsString()
  @IsNotEmpty()
  public id: string;

  @IsNotEmpty()
  public workingGroup: any;
}
