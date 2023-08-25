import { IsNotEmpty, IsDefined, IsUUID, IsBoolean } from 'class-validator';

export class FeatureFlagStatusUpdateValidator {
  @IsNotEmpty()
  @IsUUID()
  @IsDefined()
  public flagId: string;

  @IsDefined()
  @IsBoolean()
  public status: boolean;
}
