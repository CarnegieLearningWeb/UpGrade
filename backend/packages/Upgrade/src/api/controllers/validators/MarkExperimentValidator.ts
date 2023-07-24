import { IsNotEmpty, IsDefined, IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

export class MarkExperimentValidator {
  @IsString()
  public partitionId: string | undefined;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public experimentPoint: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public userId: string;

  @IsOptional()
  @IsString()
  public condition?: string | null;

  @IsUUID()
  @IsOptional()
  public experimentId?: string | null;

  @IsEnum(MARKED_DECISION_POINT_STATUS)
  @IsOptional()
  public status?: MARKED_DECISION_POINT_STATUS;
}
