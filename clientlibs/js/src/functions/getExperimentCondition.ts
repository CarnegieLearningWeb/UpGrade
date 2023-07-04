import {
  EXPERIMENT_TYPE,
  PAYLOAD_TYPE,
  IPayload,
  IExperimentAssignmentv5,
  MARKED_DECISION_POINT_STATUS,
} from 'upgrade_types';
import markExperimentPoint from './markExperimentPoint';

interface markObejectType {
  url: string;
  userId: string;
  token: string;
  clientSessionId: string;
  getAllExperimentData: IExperimentAssignmentv5[];
}

export class Assignment {
  private _site: string;
  private _target: string;
  private _markObject: markObejectType;
  private _conditionCode: string;
  private _payloadType: PAYLOAD_TYPE;
  private _payloadValue: string | null;
  private _experimentType: EXPERIMENT_TYPE;
  private _assignedFactor: Record<string, { level: string; payload: IPayload | null }>;

  constructor(
    site: string,
    target: string,
    markObject: markObejectType,
    conditionCode: string,
    payload: IPayload | null,
    assignedFactor?: Record<string, { level: string; payload: IPayload | null }>
  ) {
    this._site = site;
    this._target = target;
    this._markObject = markObject;
    this._conditionCode = conditionCode;
    this._payloadType = payload ? payload.type : PAYLOAD_TYPE.STRING;
    this._payloadValue = payload ? payload.value : null;
    this._experimentType = assignedFactor ? EXPERIMENT_TYPE.FACTORIAL : EXPERIMENT_TYPE.SIMPLE;
    this._assignedFactor = assignedFactor;
  }

  public getCondition(): string {
    return this._conditionCode;
  }

  public getPayload(): IPayload | null {
    return this._payloadValue ? { type: this._payloadType, value: this._payloadValue } : null;
  }

  public getExperimentType(): EXPERIMENT_TYPE {
    return this._experimentType;
  }

  public get factors(): string[] {
    return this._experimentType === EXPERIMENT_TYPE.FACTORIAL ? Object.keys(this._assignedFactor) : null;
  }

  public getFactorLevel(factor: string): string {
    if (this._experimentType === EXPERIMENT_TYPE.FACTORIAL) {
      return this._assignedFactor[factor] ? this._assignedFactor[factor].level : null;
    } else {
      return null;
    }
  }

  public getFactorPayload(factor: string): IPayload | null {
    if (this._experimentType === EXPERIMENT_TYPE.FACTORIAL) {
      return this._assignedFactor[factor] && this._assignedFactor[factor].payload.value
        ? { type: this._assignedFactor[factor].payload.type, value: this._assignedFactor[factor].payload.value }
        : null;
    } else {
      return null;
    }
  }

  public markDecisionPoint(status: MARKED_DECISION_POINT_STATUS, uniquifier?: string, clientError?: string) {
    return markExperimentPoint(
      this._markObject.url,
      this._markObject.userId,
      this._markObject.token,
      this._markObject.clientSessionId,
      this._site,
      this._target,
      this._conditionCode,
      status,
      this._markObject.getAllExperimentData,
      uniquifier,
      clientError
    );
  }
}

/**
 * @hidden
 */
export default function getExperimentCondition(
  experimentConditionData: IExperimentAssignmentv5[],
  site: string,
  target: string,
  markObject: markObejectType
): Assignment {
  if (experimentConditionData) {
    const result = experimentConditionData.find((data) => data.target === target && data.site === site);

    if (result) {
      const assignment = new Assignment(
        result.site,
        result.target,
        markObject,
        result.assignedCondition[0].conditionCode,
        result.assignedCondition[0].payload,
        result.assignedFactor ? result.assignedFactor[0] : null
      );

      // rotate the condition queue
      result.assignedCondition.push(result.assignedCondition.shift());
      if (result.assignedFactor) {
        result.assignedFactor.push(result.assignedFactor.shift());
      }
      return assignment;
    } else {
      return null;
    }
  } else {
    return null;
  }
}
