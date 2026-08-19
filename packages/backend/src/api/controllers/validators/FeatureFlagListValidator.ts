import { Type } from 'class-transformer';
import { IsNotEmpty, IsDefined, IsUUID, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { SegmentInputValidator } from './SegmentInputValidator';

export class FeatureFlagListValidator {
  @IsNotEmpty()
  @IsUUID()
  public id: string;

  @IsDefined()
  @IsBoolean()
  public enabled: boolean;

  @IsNotEmpty()
  @IsString()
  public listType: string;

  @ValidateNested()
  @Type(() => SegmentInputValidator)
  public segment: SegmentInputValidator;
}

export class FeatureFlagListStatusValidator {
  @IsDefined()
  @IsBoolean()
  public enabled: boolean;
}
