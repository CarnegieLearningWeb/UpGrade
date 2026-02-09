import { ExperimentCondition } from '../models/ExperimentCondition';
import { DecisionPoint } from '../models/DecisionPoint';
import { PAYLOAD_TYPE } from 'upgrade_types';

export class ConditionPayloadDTO {
  public id: string;

  public payload: { type: PAYLOAD_TYPE; value: string };

  public parentCondition: ExperimentCondition;

  public decisionPoint: DecisionPoint;
}
