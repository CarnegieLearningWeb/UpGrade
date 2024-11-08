import { IsNotEmpty, IsString } from 'class-validator';

export class SupportGetAssignmentParamsValidator {
  @IsNotEmpty()
  public userId: string;

  @IsString()
  @IsNotEmpty()
  public context: string;
}
