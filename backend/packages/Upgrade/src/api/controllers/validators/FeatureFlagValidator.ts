import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsDefined,
  IsOptional,
  ValidateNested,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';

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
  @IsBoolean({ each: true })
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
  @IsEnum(FEATURE_FLAG_STATUS)
  status: FEATURE_FLAG_STATUS;

  @IsOptional()
  @ValidateNested()
  @Type(() => FlagVariationValidator)
  variations: FlagVariationValidator[];
}
