import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, IsArray } from 'class-validator';

export class FactorStrata {
  @IsNotEmpty()
  @IsString()
  public factor: string;

  @IsObject()
  public factorValue: Record<string, number>;
}

export class StratificationInputValidator {
  @IsNotEmpty()
  @IsString()
  public userId: string;

  @IsNotEmpty()
  @IsString()
  public factor: string;

  @IsOptional()
  @IsString()
  public value?: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  public experimentIds: string[];
}

export class UploadedFilesArrayValidator {
  @IsArray()
  @IsNotEmpty({ each: true })
  @Type(() => UploadedFilesValidator)
  public files: UploadedFilesValidator[];
}

export class UploadedFilesValidator {
  @IsNotEmpty()
  @IsString()
  public file: string;
}
