import { IExperimentAssignment, EXPERIMENT_TYPE, PAYLOAD_TYPE, IPayload } from 'upgrade_types';

export class Assignment {
  private _conditionCode: string;
  private _conditionAlias: string;
  private _experimentType: EXPERIMENT_TYPE;
  private _assignedFactor: Record<string, { level: string; alias: string }>;

  constructor(
    conditionCode: string,
    conditionAlias: string,
    assignedFactor?: Record<string, { level: string; alias: string }>
  ) {
    this._conditionCode = conditionCode;
    this._conditionAlias = conditionAlias;
    this._experimentType = assignedFactor ? EXPERIMENT_TYPE.FACTORIAL : EXPERIMENT_TYPE.SIMPLE;
    this._assignedFactor = assignedFactor;
  }

  public getCondition(): string {
    return this._conditionCode;
  }

  public getPayload(): IPayload {
    return this._conditionAlias ? { type: PAYLOAD_TYPE.STRING, value: this._conditionAlias } : null;
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

  public getFactorPayload(factor: string): IPayload {
    if (this._experimentType === EXPERIMENT_TYPE.FACTORIAL) {
      return this._assignedFactor[factor] && this._assignedFactor[factor].alias
        ? { type: PAYLOAD_TYPE.STRING, value: this._assignedFactor[factor].alias }
        : null;
    } else {
      return null;
    }
  }
}

export default function getExperimentCondition(
  experimentConditionData: IExperimentAssignment[],
  experimentPoint: string,
  partitionId?: string
): Assignment {
  if (experimentConditionData) {
    const result = experimentConditionData.filter((data) =>
      partitionId
        ? data.target === partitionId && data.site === experimentPoint
        : data.site === experimentPoint && !data.target
    );

    if (result.length) {
      const assignment = new Assignment(
        result[0].assignedCondition.conditionCode,
        result[0].assignedCondition.conditionCode,
        result[0].assignedFactor
      );
      return assignment;
    } else {
      return null;
    }
  } else {
    return null;
  }
}
