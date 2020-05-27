import { IsNotEmpty, IsDefined, IsString, IsJSON } from 'class-validator';

export class LogValidator {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public userId: string;

  @IsJSON()
  @IsDefined()
  @IsNotEmpty()
  public value: string;
}
