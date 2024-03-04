import { Type } from 'class-transformer';
import { IsNotEmpty, IsDefined, IsString, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

class AssignedCondition {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  conditionCode?: string;

  @IsOptional()
  @IsString()
  experimentId?: string;
}

class Data {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  site: string;

  @IsString()
  target: string;

  @ValidateNested()
  @Type(() => AssignedCondition)
  assignedCondition: AssignedCondition;
}

export class MarkExperimentValidatorv5 {
  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => Data)
  public data: Data;

  @IsEnum(MARKED_DECISION_POINT_STATUS)
  @IsOptional()
  public status?: MARKED_DECISION_POINT_STATUS;

  @IsString()
  @IsOptional()
  public uniquifier?: string;

  @IsString()
  @IsOptional()
  public clientError?: string;
}
