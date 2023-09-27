import { IsNotEmpty, IsObject, IsOptional, IsString, IsArray } from 'class-validator';

export class FactorStrata {
  @IsNotEmpty()
  @IsString()
  public factor: string;

  @IsObject()
  public value: Record<string, number>;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  public experimentIds: string[];
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
}
