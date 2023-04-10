import { IsNotEmpty, IsDefined } from 'class-validator';
import { MARKED_DECISION_POINT_STATUS, PAYLOAD_TYPE } from 'upgrade_types';

export class MarkExperimentValidatorv4 {
  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  public data: {
    site: string;
    target: string | undefined;
    assignedCondition: { conditionCode: string; experimentId: string };
    assignedFactor:
      | Record<string, { level: string; payload: { type: PAYLOAD_TYPE; value: string } | null }>
      | undefined;
  };

  public status?: MARKED_DECISION_POINT_STATUS;

  public clientError?: string;
}
