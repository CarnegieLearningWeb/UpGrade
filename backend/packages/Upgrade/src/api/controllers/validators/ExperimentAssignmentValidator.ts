import { IsNotEmpty, IsDefined, IsString } from 'class-validator';

export class ExperimentAssignmentValidatorv6 {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public context: string;
}

export class ExperimentAssignmentValidator extends ExperimentAssignmentValidatorv6 {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public userId: string;
}
