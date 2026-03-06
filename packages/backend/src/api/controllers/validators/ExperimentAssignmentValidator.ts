import { IsNotEmpty, IsString } from 'class-validator';

export class ExperimentAssignmentValidatorv6 {
  @IsNotEmpty()
  @IsString()
  public context: string;
}

export class ExperimentAssignmentValidator extends ExperimentAssignmentValidatorv6 {
  @IsNotEmpty()
  @IsString()
  public userId: string;
}
