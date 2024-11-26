import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class DataLogAnalysisValidator {
  @IsString({ each: true })
  @IsNotEmpty()
  @IsArray()
  public queryIds: string[];
}
