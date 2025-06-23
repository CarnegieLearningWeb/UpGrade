import {
  IsNotEmpty,
  IsDefined,
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { FILTER_MODE, FEATURE_FLAG_STATUS, LIST_FILTER_MODE } from 'upgrade_types';
import { Type } from 'class-transformer';
import { FeatureFlagListValidator } from './FeatureFlagListValidator';

export class FeatureFlagCoreValidation {
  @IsOptional()
  @IsUUID()
  public id: string;

  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsOptional()
  @IsString()
  public description: string;

  @IsNotEmpty()
  @IsString()
  public key: string;

  @IsNotEmpty()
  @IsEnum(FEATURE_FLAG_STATUS)
  public status: FEATURE_FLAG_STATUS;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  public context: string[];

  @IsDefined()
  @IsEnum(FILTER_MODE)
  public filterMode: FILTER_MODE;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  public tags: string[];
}

export class FeatureFlagValidation extends FeatureFlagCoreValidation {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagListValidator)
  public featureFlagSegmentInclusion?: FeatureFlagListValidator[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagListValidator)
  public featureFlagSegmentExclusion?: FeatureFlagListValidator[];
}

export class IdValidator {
  @IsNotEmpty()
  @IsUUID()
  public id: string;
}

export class FeatureFlagImportValidation {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagFile)
  public files: FeatureFlagFile[];
}

export class FeatureFlagListImportValidation {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagFile)
  public files: FeatureFlagFile[];

  @IsString()
  @IsNotEmpty()
  @IsEnum(LIST_FILTER_MODE)
  public listType: LIST_FILTER_MODE;

  @IsUUID()
  @IsNotEmpty()
  public flagId: string;
}

class FeatureFlagFile {
  @IsString()
  @IsNotEmpty()
  public fileName: string;

  @IsString()
  @IsDefined()
  public fileContent: string;
}
