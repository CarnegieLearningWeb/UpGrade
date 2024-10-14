import { IsNotEmpty, IsString } from 'class-validator';
export class FailedParamsValidator {
  @IsNotEmpty()
  @IsString()
  public experimentPoint: string;

  @IsString()
  @IsNotEmpty()
  public reason: string;

  @IsString()
  public userId: string;

  @IsString()
  public experimentId?: string;
}
