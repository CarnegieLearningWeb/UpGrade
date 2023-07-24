import { IsNotEmpty, IsDefined, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

export class MarkExperimentValidator {
  @IsString()
  public target: string | undefined;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public site: string;

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
