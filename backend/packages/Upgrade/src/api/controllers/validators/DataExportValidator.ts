import { IsNotEmpty, IsString } from 'class-validator';

export class DataExportValidator {
  @IsString()
  @IsNotEmpty()
  public experimentId: string;

  @IsString()
  @IsNotEmpty()
  public email: string;
}
