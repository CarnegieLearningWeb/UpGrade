import { IsNotEmpty, IsString } from 'class-validator';

export class ExperimentAssignmentValidatorv6 {
  @IsNotEmpty()
  @IsString()
  public context: string;

  public site?: string;
  public target?: string;
}

export class ExperimentAssignmentValidator extends ExperimentAssignmentValidatorv6 {
  @IsNotEmpty()
  @IsString()
  public userId: string;
}
