import { IsNotEmpty, IsDefined } from 'class-validator';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

export class MarkExperimentValidator2 {
  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  public data: {
    site: string;
    target: string | undefined;
    assignedCondition: { conditionCode: string; experimentId: string };
    assignedFactor: object | undefined;
  };

  @IsNotEmpty()
  @IsDefined()
  public site: string;

  @IsNotEmpty()
  @IsDefined()
  public assignedCondition: { conditionCode: string; experimentId: string };

  public assignedFactor: object | undefined;

  public status?: MARKED_DECISION_POINT_STATUS;
}
