import { IExperimentAssignment, EXPERIMENT_TYPE } from 'upgrade_types';

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

  public get conditionCode(): string {
    return this._conditionCode;
  }

  public get conditionAlias(): string {
    return this._conditionAlias;
  }

  public get experimentType(): EXPERIMENT_TYPE {
    return this._experimentType;
  }

  public get factors(): string[] {
    return this._experimentType === EXPERIMENT_TYPE.FACTORIAL ? Object.keys(this._assignedFactor) : null;
  }

  public getFactorAssignment(factor: string): FactorAssignment {
    return this._experimentType === EXPERIMENT_TYPE.FACTORIAL
      ? new FactorAssignment(this._assignedFactor[factor])
      : null;
  }
}

class FactorAssignment {
  private _levelCode: string;
  private _levelAlias: string;

  constructor(assignedFactor: { level: string; alias: string }) {
    this._levelCode = assignedFactor['level'] || null;
    this._levelAlias = assignedFactor['alias'] || null;
  }

  public get levelCode(): string {
    return this._levelCode;
  }

  public get levelAlias(): string {
    return this._levelAlias;
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
