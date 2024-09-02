import {
  IsNotEmpty,
  IsDefined,
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { FILTER_MODE, SEGMENT_TYPE } from 'upgrade_types';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';
import { Type } from 'class-transformer';

class IndividualValidator {
  @IsNotEmpty()
  @IsString()
  public userId: string;
}

class GroupValidator {
  @IsNotEmpty()
  @IsString()
  public groupId: string;

  @IsNotEmpty()
  @IsString()
  public type: string;
}

class SegmentValidator {
  @IsOptional()
  @IsUUID()
  @IsString()
  public id?: string;

  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsNotEmpty()
  @IsString()
  public context: string;

  @IsNotEmpty()
  @IsEnum(SEGMENT_TYPE)
  public type: SEGMENT_TYPE;
}

class SegmentImportValidator {
  @IsOptional()
  @IsUUID()
  @IsString()
  public id?: string;

  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsNotEmpty()
  @IsString()
  public context: string;

  @IsNotEmpty()
  @IsEnum(SEGMENT_TYPE)
  public type: SEGMENT_TYPE;

  @IsArray()
  @ValidateNested()
  @Type(() => IndividualValidator)
  public individualForSegment: IndividualValidator[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupValidator)
  public groupForSegment: GroupValidator[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentValidator)
  public subSegments: SegmentValidator[];
}

class FeatureFlagListImportValidator {
  @IsDefined()
  @IsBoolean()
  public enabled: boolean;

  @IsNotEmpty()
  @IsDefined()
  public listType: string;

  @ValidateNested()
  @Type(() => SegmentImportValidator)
  public segment: SegmentImportValidator;
}

export class FeatureFlagImportDataValidation {
  @IsOptional()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  name: string;

  @IsOptional()
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

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  public context: string[];

  @IsDefined()
  @IsEnum(FILTER_MODE)
  filterMode: FILTER_MODE;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  public tags: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagListImportValidator)
  public featureFlagSegmentInclusion?: FeatureFlagListImportValidator[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagListImportValidator)
  public featureFlagSegmentExclusion?: FeatureFlagListImportValidator[];
}
