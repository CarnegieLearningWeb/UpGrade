import { IsNotEmpty, IsDefined, IsUUID, IsEnum } from 'class-validator';
import { FILTER_MODE } from 'upgrade_types';

export class FeatureFlagFilterModeUpdateValidator {
  @IsNotEmpty()
  @IsUUID()
  @IsDefined()
  public flagId: string;

  @IsDefined()
  @IsEnum(FILTER_MODE)
  public filterMode: FILTER_MODE;
}
