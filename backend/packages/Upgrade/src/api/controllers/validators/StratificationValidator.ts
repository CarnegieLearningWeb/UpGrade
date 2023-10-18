import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

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
}
