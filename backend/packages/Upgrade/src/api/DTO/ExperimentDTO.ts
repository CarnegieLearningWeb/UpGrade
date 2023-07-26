import { IsArray, IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
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
  SEGMENT_TYPE,
} from 'upgrade_types';
import { Query } from '../models/Query';
import { StateTimeLog } from '../models/StateTimeLogs';
import { ConditionPayloadDTO } from './ConditionPayloadDTO';
import { FactorDTO } from './FactorDTO';
import { Type } from 'class-transformer';

export {
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_AS,
  EXPERIMENT_SORT_KEY,
  IExperimentSearchParams,
  IExperimentSortParams,
};

class Segment {
  @IsString()
  @IsNotEmpty()
  public id: string;

  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsString()
  @IsNotEmpty()
  public context: string;

  @IsString()
  @IsEnum(SEGMENT_TYPE)
  public type: SEGMENT_TYPE;
}

class ExperimentSegmentInclusion {
  @IsNotEmpty()
  @Type(() => Segment)
  public segment: Segment;
}

class ExperimentSegmentExclusion {
  @IsNotEmpty()
  @Type(() => Segment)
  public segment: Segment;
}

export class ExperimentDTO {
  @IsString()
  @IsNotEmpty()
  public id: string;

  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  public context: string[];

  @IsNotEmpty()
  @IsEnum(EXPERIMENT_STATE)
  public state: EXPERIMENT_STATE;

  @IsNotEmpty()
  @IsDateString()
  public startOn: Date;

  @IsNotEmpty()
  @IsEnum(CONSISTENCY_RULE)
  public consistencyRule: CONSISTENCY_RULE;

  @IsNotEmpty()
  @IsEnum(ASSIGNMENT_UNIT)
  public assignmentUnit: ASSIGNMENT_UNIT;

  @IsNotEmpty()
  @IsEnum(POST_EXPERIMENT_RULE)
  public postExperimentRule: POST_EXPERIMENT_RULE;

  // TODO add conditional validity here ie endOn is null
  public enrollmentCompleteCondition: Partial<IEnrollmentCompleteCondition>;

  // TODO add conditional validity here ie enrollmentCompleteCondition is null
  @IsNotEmpty()
  @IsDateString()
  public endOn: Date;

  @IsNotEmpty()
  @IsString()
  public revertTo: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  public tags: string[];

  @IsNotEmpty()
  @IsString()
  public group: string;

  @IsNotEmpty()
  @IsBoolean()
  public logging: boolean;

  @IsNotEmpty()
  @IsEnum(FILTER_MODE)
  public filterMode: FILTER_MODE;

  public conditions: ExperimentCondition[];

  public factors: FactorDTO[];

  public partitions: DecisionPoint[];

  public conditionPayloads: ConditionPayloadDTO[];

  public queries: Query[];

  public stateTimeLogs: StateTimeLog[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ExperimentSegmentInclusion)
  public experimentSegmentInclusion: ExperimentSegmentInclusion;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ExperimentSegmentExclusion)
  public experimentSegmentExclusion: ExperimentSegmentExclusion;

  @IsNotEmpty()
  @IsString()
  public backendVersion: string;

  @IsNotEmpty()
  @IsString()
  public type: string;
}
