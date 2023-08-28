import { Type } from 'class-transformer';
import { IsNotEmpty, IsDefined, IsOptional, ValidateNested, IsString, IsBoolean, IsArray } from 'class-validator';

class FlagVariationValidator {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsBoolean({each: true})
  defaultVariation?: boolean[];
}

export class FeatureFlagValidation {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  name: string;
  
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  variationType: string;

  @IsNotEmpty()
  @IsDefined()
  @IsBoolean()
  status: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => FlagVariationValidator)
  variations: FlagVariationValidator[];
}