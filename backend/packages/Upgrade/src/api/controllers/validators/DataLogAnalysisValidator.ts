import { IsNotEmpty, IsString, IsDefined, IsArray } from 'class-validator';

export class DataLogAnalysisValidator {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  @IsArray()
  public queryIds: string[];
}
