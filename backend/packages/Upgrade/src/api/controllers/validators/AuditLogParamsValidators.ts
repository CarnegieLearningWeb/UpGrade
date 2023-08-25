import { IsNumber, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { EXPERIMENT_LOG_TYPE } from 'upgrade_types';
export class AuditLogParamsValidator {
  @IsNumber()
  @IsNotEmpty()
  public skip: number;

  @IsNumber()
  @IsNotEmpty()
  public take: number;

  @IsOptional()
  @IsEnum(EXPERIMENT_LOG_TYPE)
  public filter?: EXPERIMENT_LOG_TYPE;
}
