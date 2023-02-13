import { IsNotEmpty, IsUUID, IsObject, IsEnum } from 'class-validator';
import { EXPERIMENT_STATE } from 'upgrade_types';

export class ExperimentAssignmentValidator {
  @IsNotEmpty()
  @IsUUID()
  public experimentId: string;

  @IsNotEmpty()
  public site: string;

  @IsNotEmpty()
  public userId: string;

  @IsObject()
  public userEnvironment: object;

  @IsEnum(EXPERIMENT_STATE)
  public state: EXPERIMENT_STATE;
}
