import { IsNotEmpty, IsDefined, IsUUID, IsEnum, IsDate, IsOptional } from 'class-validator';
import { EXPERIMENT_STATE } from 'upgrade_types';

export class AssignmentStateUpdateValidator {
  @IsOptional()
  @IsDate()
  public scheduleDate?: Date | undefined;

  @IsNotEmpty()
  @IsUUID()
  @IsDefined()
  public experimentId: string;

  @IsDefined()
  @IsEnum(EXPERIMENT_STATE)
  public state: EXPERIMENT_STATE;
}
