import { IsNotEmpty, IsDefined, IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { EXPERIMENT_STATE } from 'upgrade_types';

export class AssignmentStateUpdateValidator {
  @IsOptional()
  @IsDateString()
  public scheduleDate?: Date | undefined;

  @IsNotEmpty()
  @IsUUID()
  @IsDefined()
  public experimentId: string;

  @IsDefined()
  @IsEnum(EXPERIMENT_STATE)
  public state: EXPERIMENT_STATE;
}
