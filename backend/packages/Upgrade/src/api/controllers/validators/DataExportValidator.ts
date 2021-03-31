import { IsNotEmpty, IsString, IsDefined } from 'class-validator';

export class DataExportValidator {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  public experimentId: string;

  @IsString()
  @IsNotEmpty()
  @IsDefined()
  public email: string;
}
