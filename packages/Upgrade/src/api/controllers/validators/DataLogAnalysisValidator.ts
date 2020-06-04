import { IsNotEmpty, IsString, IsDefined } from 'class-validator';

export class DataLogAnalysisValidator {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  public queryId: string;
}
