import { IsNotEmpty, IsDefined, IsString, IsArray, IsEnum, IsOptional, ValidateNested, IsUUID } from 'class-validator';
import { FILTER_MODE } from 'upgrade_types';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';
import { Type } from 'class-transformer';
import { FeatureFlagListValidator } from './FeatureFlagListValidator';

export class FeatureFlagCoreValidation {
  @IsOptional()
  @IsString()
  public id: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public name: string;

  @IsOptional()
  @IsString()
  public description: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public key: string;

  @IsNotEmpty()
  @IsDefined()
  @IsEnum(FEATURE_FLAG_STATUS)
  public status: FEATURE_FLAG_STATUS;

  @IsNotEmpty()
  @IsArray()
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

export class UserParamsValidator {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public userId: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public context: string;
}

export class IdValidator {
  @IsNotEmpty()
  @IsDefined()
  @IsUUID()
  public id: string;
}

export class FeatureFlagImportValidation {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagFile)
  public files: FeatureFlagFile[];
}

class FeatureFlagFile {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  public fileName: string;

  @IsString()
  @IsDefined()
  public fileContent: string;
}
