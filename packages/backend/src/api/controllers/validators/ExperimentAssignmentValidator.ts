import { IsNotEmpty, IsString } from 'class-validator';

export class ExperimentAssignmentValidatorv6 {
  @IsNotEmpty()
  @IsString()
  public context: string;
}
