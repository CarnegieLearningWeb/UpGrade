import { IsNumber, IsNotEmpty, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { LOG_TYPE } from 'upgrade_types';
export class AuditLogParamsValidator {
  @IsNumber()
  @IsNotEmpty()
  public skip: number;

  @IsNumber()
  @IsNotEmpty()
  public take: number;

  @IsOptional()
  @IsEnum(LOG_TYPE)
  public filter?: LOG_TYPE;

  @IsOptional()
  @IsString()
  @IsUUID()
  public experimentId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  public flagId?: string;
}
