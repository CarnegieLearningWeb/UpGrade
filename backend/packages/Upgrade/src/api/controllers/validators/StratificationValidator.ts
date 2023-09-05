import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class FactorStrata {
  @IsUUID()
  @IsString()
  public id: string;

  @IsNotEmpty()
  @IsString()
  public factor: string;

  @IsObject()
  public value: Record<string, number>;

  @IsOptional()
  @IsInt()
  @IsNotEmpty()
  public notApplicable?: number;
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