import { IsNumber, IsNotEmpty } from 'class-validator';
import { EXPERIMENT_LOG_TYPE } from 'upgrade_types';
export class AuditLogParamsValidator {
  @IsNumber()
  @IsNotEmpty()
  public skip: number;

  @IsNumber()
  @IsNotEmpty()
  public take: number;

  public filter: EXPERIMENT_LOG_TYPE;
}
