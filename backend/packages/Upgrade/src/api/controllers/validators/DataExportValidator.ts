import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DataExportValidator {
  @IsNotEmpty()
  @IsUUID()
  public experimentId: string;

  @IsNotEmpty()
  @IsString()
  public email: string;
}
