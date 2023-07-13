import markDecisionPoint from "./functions/markDecisionPoint";
import { IExperimentAssignmentv5, PAYLOAD_TYPE, EXPERIMENT_TYPE, IPayload, MARKED_DECISION_POINT_STATUS } from "../../../types/src";
import { Interfaces } from "identifiers/Interfaces";

export default class Assignment {
  private _site: string;
  private _target: string;
  private _clientState: Interfaces.IClientState;
  private _conditionCode: string;
  private _payloadType: PAYLOAD_TYPE;
  private _payloadValue: string | null;
  private _experimentType: EXPERIMENT_TYPE;
  private _assignedFactor: Record<string, { level: string; payload: IPayload | null }>;

  constructor(
    getAllDataPerDecisionPoint: IExperimentAssignmentv5,
    clientState: Interfaces.IClientState,
  ) {
    this._site = getAllDataPerDecisionPoint.site;
    this._target = getAllDataPerDecisionPoint.target;
    this._clientState = clientState;
    this._conditionCode = getAllDataPerDecisionPoint.assignedCondition[0].conditionCode;
    this._payloadType = getAllDataPerDecisionPoint.assignedCondition[0].payload
      ? getAllDataPerDecisionPoint.assignedCondition[0].payload.type
      : PAYLOAD_TYPE.STRING;
    this._payloadValue = getAllDataPerDecisionPoint.assignedCondition[0].payload
      ? getAllDataPerDecisionPoint.assignedCondition[0].payload.value 
      : null;
    this._experimentType = getAllDataPerDecisionPoint.assignedFactor ? EXPERIMENT_TYPE.FACTORIAL : EXPERIMENT_TYPE.SIMPLE;
    this._assignedFactor = getAllDataPerDecisionPoint.assignedFactor ? getAllDataPerDecisionPoint.assignedFactor[0] : null;
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
    return markDecisionPoint(
      this._clientState.config.api.markDecisionPoint,
      this._clientState.config.userId,
      this._clientState.config.token,
      this._clientState.config.clientSessionId,
      this._site,
      this._target,
      this._conditionCode,
      status,
      this._clientState.allExperimentAssignmentData,
      uniquifier,
      clientError
    );
  }
}