import { IsNotEmpty, IsDefined } from 'class-validator';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

export class MarkExperimentValidator2 {
  public target: string | undefined;

  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  @IsNotEmpty()
  @IsDefined()
  public site: string;

  @IsNotEmpty()
  @IsDefined()
  public assignedCondition: { conditionCode: string; experimentId: string };

  public assignedFactor: object | undefined;

  public status?: MARKED_DECISION_POINT_STATUS;
}
