import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsTimeZone,
  ValidateNested,
  IsArray,
  IsJSON,
  IsEmail,
} from 'class-validator';
import { LOG_TYPE, UserRole } from 'upgrade_types';

class ExperimentAuditLogValidator {
  @IsString()
  @IsNotEmpty()
  public id: string;

  @IsEnum(LOG_TYPE)
  @IsNotEmpty()
  public type: LOG_TYPE;

  @IsJSON()
  @IsNotEmpty()
  public data: object;
}

export class UserDTO {
  @IsString()
  @IsOptional()
  public firstName: string;

  @IsString()
  @IsOptional()
  public lastName: string;

  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsEnum(UserRole)
  @IsOptional()
  public role?: UserRole;

  @IsOptional()
  @IsUrl()
  public imageUrl?: string;

  @IsOptional()
  @IsString()
  @IsTimeZone()
  public localTimeZone?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperimentAuditLogValidator)
  auditLogs?: ExperimentAuditLogValidator[];
}
