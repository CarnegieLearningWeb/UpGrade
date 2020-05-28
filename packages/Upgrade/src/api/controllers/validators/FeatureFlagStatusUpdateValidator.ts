import { IsNotEmpty, IsDefined, IsUUID } from 'class-validator';

export class FeatureFlagStatusUpdateValidator {
  @IsNotEmpty()
  @IsUUID()
  @IsDefined()
  public flagId: string;

  @IsDefined()
  public status: boolean;
}
