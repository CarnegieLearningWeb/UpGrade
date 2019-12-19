import { IsDefined, IsNotEmpty } from 'class-validator';

export class ExperimentConditionValidator {
  public name: string;
  public description: string;

  @IsDefined()
  @IsNotEmpty()
  public assignmentWeight: number;

  @IsDefined()
  @IsNotEmpty()
  public  conditionCode: string;
}
