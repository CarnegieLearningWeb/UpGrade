import { IExperimentAssignmentv4, EXPERIMENT_TYPE, PAYLOAD_TYPE, IPayload } from 'upgrade_types';

export class Assignment {
  private _conditionCode: string;
  private _payloadType: PAYLOAD_TYPE;
  private _payloadValue: string | null;
  private _experimentType: EXPERIMENT_TYPE;
  private _assignedFactor: Record<string, { level: string; payload: IPayload | null }>;

  constructor(
    conditionCode: string,
    payload: IPayload | null,
    assignedFactor?: Record<string, { level: string; payload: IPayload | null }>
  ) {
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
}

/**
 * @hidden
 */
export default function getExperimentCondition(
  experimentConditionData: IExperimentAssignmentv4[],
  site: string,
  target: string
): Assignment {
  if (experimentConditionData) {
    const result = experimentConditionData.find((data) => data.target === target && data.site === site);

    if (result) {
      const assignment = new Assignment(
        result.assignedCondition.conditionCode,
        result.assignedCondition.payload,
        result.assignedFactor
      );
      return assignment;
    } else {
      return null;
    }
  } else {
    return null;
  }
}
