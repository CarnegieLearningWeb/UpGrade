import { DataService } from './DataService';
import {
  IExperimentAssignmentv5,
  PAYLOAD_TYPE,
  EXPERIMENT_TYPE,
  IPayload,
  MARKED_DECISION_POINT_STATUS,
} from '../../../types/src';
import { UpGradeClientInterfaces } from './types';
import ApiService from './ApiService';

export default class Assignment {
  private _site: string;
  private _target: string;
  private _conditionCode: string;
  private _payloadType: PAYLOAD_TYPE;
  private _payloadValue: string | null;
  private _experimentType: EXPERIMENT_TYPE;
  private _assignedFactor: Record<string, { level: string; payload: IPayload | null }>;

  constructor(
    { site, target, assignedCondition, assignedFactor }: IExperimentAssignmentv5,
    private apiService: ApiService,
    private dataService: DataService
  ) {
    this._site = site;
    this._target = target;
    this._conditionCode = assignedCondition[0].conditionCode;
    this._payloadType = assignedCondition[0].payload ? assignedCondition[0].payload.type : PAYLOAD_TYPE.STRING;
    this._payloadValue = assignedCondition[0].payload ? assignedCondition[0].payload.value : null;
    this._experimentType = assignedFactor ? EXPERIMENT_TYPE.FACTORIAL : EXPERIMENT_TYPE.SIMPLE;
    this._assignedFactor = assignedFactor ? assignedFactor[0] : null;
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

  /**
   * Will record ("mark") that a user has "seen" an experiment condition per at the Assignment's decision point location (site + target).
   *
   * Marking the decision point will record the user's condition assignment and the time of the decision point, regardless of whether the user is enrolled in an experiment.
   *
   * @param status `status` signifies a client application's note on what it did in the code with condition assignment that Upgrade provided.
   *  Status can be one of the following:
   *
   * ```ts
   * export enum MARKED_DECISION_POINT_STATUS {
   *   CONDITION_APPLIED = 'condition applied',
   *   CONDITION_FAILED_TO_APPLY = 'condition not applied',
   *   NO_CONDITION_ASSIGNED = 'no condition assigned',
   * }
   * ```
   * @param uniquifier A `uniquifier` unique string can be sent along to help tie a user's logged metrics to a specific marked condition.
   * This identifier will also need to be sent when calling `upgradeClient.log()`
   * This is required for 'within-subjects' experiments.
   *
   * @param clientError The client can also send along an additional `clientError` string to log context as to why a condition was not applied.
   *
   * @example
   * ```ts
   * import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';
   *
   * const site = 'dashboard';
   * const target = 'experimental button';
   * const status: MARKED_DECISION_POINT_STATUS = MARKED_DECISION_POINT_STATUS.CONDITION_FAILED_TO_APPLY
   * const clientError = 'variant not recognized'; //optional
   *
   *  ```ts
   * const assignment: Assignment[] = await upgradeClient.getDecisionPointAssignment(site, target);
   * const markResponse = await assignment.markDecisionPoint(MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);
   * ```
   *
   * Note*: mark can also be called via `Client.markDecisionPoint()` without an Assignment object`:
   * ```ts
   * import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';
   *
   * const site = 'dashboard';
   * const target = 'experimental button';
   * const condition = 'variant_x'; // send null if no condition / no experiment is running / error
   * const status: MARKED_DECISION_POINT_STATUS = MARKED_DECISION_POINT_STATUS.CONDITION_FAILED_TO_APPLY
   * const clientError = 'variant not recognized'; //optional
   *
   * const markResponse = await upgradeClient.markDecisionPoint(site, target, condition, MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);
   * ```
   */

  public async markDecisionPoint(status: MARKED_DECISION_POINT_STATUS, uniquifier?: string, clientError?: string) {
    const markDecisionPointParams: UpGradeClientInterfaces.MarkDecisionPointParams = {
      site: this._site,
      target: this._target,
      condition: this._conditionCode,
      status,
      uniquifier,
      clientError,
    };

    return await this.apiService.markDecisionPoint(markDecisionPointParams);
  }
}
