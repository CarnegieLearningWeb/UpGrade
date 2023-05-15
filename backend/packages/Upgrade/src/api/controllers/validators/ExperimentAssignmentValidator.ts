import { IsNotEmpty, IsDefined } from 'class-validator';

export class ExperimentAssignmentValidator {
  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  @IsNotEmpty()
  @IsDefined()
  public context: string;
}