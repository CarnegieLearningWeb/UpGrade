import { IsNotEmpty } from 'class-validator';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { DecisionPoint } from '../models/DecisionPoint';
import {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
  EXPERIMENT_SORT_AS,
  FILTER_MODE,
  IEnrollmentCompleteCondition,
  IExperimentSearchParams,
  IExperimentSortParams,
} from 'upgrade_types';
import { Query } from '../models/Query';
import { StateTimeLog } from '../models/StateTimeLogs';
import { ExperimentSegmentInclusion } from '../models/ExperimentSegmentInclusion';
import { ExperimentSegmentExclusion } from '../models/ExperimentSegmentExclusion';
import { ConditionPayloadDTO } from './ConditionPayloadDTO';
import { FactorDTO } from './FactorDTO';

export {
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_AS,
  EXPERIMENT_SORT_KEY,
  IExperimentSearchParams,
  IExperimentSortParams,
};

export class ExperimentDTO {
  public id: string;

  public name: string;

  public description: string;

  public context: string[];

  @IsNotEmpty()
  public state: EXPERIMENT_STATE;

  @IsNotEmpty()
  public startOn: Date;

  @IsNotEmpty()
  public consistencyRule: CONSISTENCY_RULE;

  @IsNotEmpty()
  public assignmentUnit: ASSIGNMENT_UNIT;

  @IsNotEmpty()
  public postExperimentRule: POST_EXPERIMENT_RULE;

  // TODO add conditional validity here ie endOn is null
  public enrollmentCompleteCondition: Partial<IEnrollmentCompleteCondition>;

  // TODO add conditional validity here ie enrollmentCompleteCondition is null
  public endOn: Date;

  public revertTo: string;

  public tags: string[];

  public group: string;

  public logging: boolean;

  public filterMode: FILTER_MODE;

  public conditions: ExperimentCondition[];

  public factors: FactorDTO[];

  public partitions: DecisionPoint[];

  public conditionPayloads: ConditionPayloadDTO[];

  public queries: Query[];

  public stateTimeLogs: StateTimeLog[];

  public experimentSegmentInclusion: ExperimentSegmentInclusion;

  public experimentSegmentExclusion: ExperimentSegmentExclusion;

  public backendVersion: string;

  public type: string;
}
