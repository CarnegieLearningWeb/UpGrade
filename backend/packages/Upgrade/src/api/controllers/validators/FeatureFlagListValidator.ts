import { Type } from 'class-transformer';
import { IsNotEmpty, IsDefined, IsUUID, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { SegmentInputValidator } from 'src/api/controllers/validators/SegmentInputValidator';

export class FeatureFlagListValidator {
  @IsNotEmpty()
  @IsUUID()
  @IsDefined()
  public flagId: string;

  @IsDefined()
  @IsBoolean()
  public enabled: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SegmentInputValidator)
  public list: SegmentInputValidator;

  @IsOptional()
  @IsUUID()
  public segmentId?: string;
}

export class RemoveListValidator {
  @IsNotEmpty()
  @IsUUID()
  @IsDefined()
  public flagId: string;

  @IsNotEmpty()
  @IsUUID()
  @IsDefined()
  public segmentId: string;
}

export class ListEditRequestValidator {
  @IsNotEmpty()
  @IsDefined()
  public oldType: string;

  @IsNotEmpty()
  @IsDefined()
  public newType: string;

  @IsNotEmpty()
  @IsUUID()
  @IsDefined()
  public oldSegmentId: string;

  @ValidateNested()
  @Type(() => FeatureFlagListValidator)
  public listInput: FeatureFlagListValidator;
}
