import { Type, Transform } from 'class-transformer';
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
  site: string;

  @Transform(({ value }) => value ?? '')
  @IsString()
  target = '';

  @IsOptional()
  @ValidateNested()
  @Type(() => AssignedCondition)
  assignedCondition: AssignedCondition;
}

export class MarkExperimentValidatorv6 {
  // MAKE CONTEXT REQUIRED WHEN ALL CLIENTS ARE UPDATED. FOR NOW, KEEPING IT OPTIONAL TO SUPPORT PRE-6.6 CLIENTS THAT DON'T SEND CONTEXT IN THE REQUEST BODY.
  @IsString()
  @IsOptional()
  public context?: string;

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
