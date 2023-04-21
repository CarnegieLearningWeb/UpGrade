import { IsNotEmpty, ValidateIf, ValidateNested } from 'class-validator';
import { ExperimentCondition } from '../api/models/ExperimentCondition';
import { DecisionPoint } from '../api/models/DecisionPoint';
import { StateTimeLog } from '../api/models/StateTimeLogs';
import {
  EXPERIMENT_STATE,
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  IEnrollmentCompleteCondition,
  FILTER_MODE,
} from 'upgrade_types';
import { Query } from '../api/models/Query';
import { SegmentInputValidator } from 'src/api/controllers/validators/SegmentInputValidator';
import { ConditionPayload } from 'src/api/models/ConditionPayload';

export class ExperimentInput {
  public id: string;

  @IsNotEmpty()
  public name: string;

  public description: string;

  public context: string[];

  @IsNotEmpty()
  public state: EXPERIMENT_STATE;

  @ValidateIf((o) => o.state === EXPERIMENT_STATE.SCHEDULED)
  @IsNotEmpty()
  public startOn: Date;

  @IsNotEmpty()
  public consistencyRule: CONSISTENCY_RULE;

  @IsNotEmpty()
  public assignmentUnit: ASSIGNMENT_UNIT;

  @IsNotEmpty()
  public postExperimentRule: POST_EXPERIMENT_RULE;

  public enrollmentCompleteCondition: Partial<IEnrollmentCompleteCondition>;

  public endOn: Date;

  public revertTo: string;

  public tags: string[];

  public group: string;

  public logging: boolean;

  @ValidateNested()
  public conditions: ExperimentCondition[];

  @ValidateNested()
  public partitions: DecisionPoint[];

  @ValidateNested()
  public conditionPayloads: ConditionPayload[];

  @ValidateNested()
  public stateTimeLogs: StateTimeLog[];

  @ValidateNested()
  public queries: Query[];

  public createdAt: Date;
  public updatedAt: Date;
  public versionNumber: number;

  public filterMode: FILTER_MODE;
  public segmentInclude: Omit<SegmentInputValidator, 'id' | 'name' | 'description' | 'context'>;
  public segmentExclude: Omit<SegmentInputValidator, 'id' | 'name' | 'description' | 'context'>;
  public backendVersion: string;
}
