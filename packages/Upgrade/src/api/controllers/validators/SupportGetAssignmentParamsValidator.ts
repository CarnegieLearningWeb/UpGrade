import { IsNotEmpty, IsDefined, IsString } from 'class-validator';

export class SupportGetAssignmentParamsValidator {
  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  @IsString()
  @IsNotEmpty()
  @IsDefined()
  public context: string;
}
