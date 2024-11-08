import { IsNotEmpty, IsDefined, IsUUID, IsEnum } from 'class-validator';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';

export class FeatureFlagStatusUpdateValidator {
  @IsNotEmpty()
  @IsUUID()
  public flagId: string;

  @IsDefined()
  @IsEnum(FEATURE_FLAG_STATUS)
  public status: FEATURE_FLAG_STATUS;
}
