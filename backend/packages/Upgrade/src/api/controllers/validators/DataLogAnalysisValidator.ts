import { IsNotEmpty, IsString, IsDefined, IsArray } from 'class-validator';

export class DataLogAnalysisValidator {
  @IsString({each: true})
  @IsNotEmpty()
  @IsDefined()
  @IsArray()
  public queryIds: string[];
}
