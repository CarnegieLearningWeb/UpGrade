import { IsNotEmpty, IsDefined, IsString } from 'class-validator';
export class FailedParamsValidator {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public site: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  public reason: string;

  @IsString()
  public userId: string;

  @IsString()
  public target?: string;
}
