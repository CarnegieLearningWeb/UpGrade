import { IsNotEmpty, IsDefined, IsString } from 'class-validator';

export class ExperimentAssignmentValidator {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public userId: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public context: string;
}
