import { IsNotEmpty, IsDefined } from 'class-validator';

export class ExperimentAssignmentValidator {
  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  public context: string | undefined;
}
