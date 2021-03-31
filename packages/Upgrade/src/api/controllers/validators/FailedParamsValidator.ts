import { IsNotEmpty, IsDefined, IsString } from 'class-validator';
export class FailedParamsValidator {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public experimentPoint: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  public reason: string;

  @IsString()
  public userId: string;

  @IsString()
  public experimentId?: string;
}
