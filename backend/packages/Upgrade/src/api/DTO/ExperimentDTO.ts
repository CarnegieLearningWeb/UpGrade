import {
  ArrayMinSize,
  IsAlphanumeric,
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
  SORT_AS_DIRECTION,
  FILTER_MODE,
  IEnrollmentCompleteCondition,
  IExperimentSearchParams,
  IExperimentSortParams,
  SEGMENT_TYPE,
  CONDITION_ORDER,
  PAYLOAD_TYPE,
  REPEATED_MEASURE,
  EXPERIMENT_TYPE,
  ASSIGNMENT_ALGORITHM,
  MoocletTSConfigurablePolicyParametersDTO,
  MoocletPolicyParametersDTO,
  SUPPORTED_MOOCLET_ALGORITHMS,
} from 'upgrade_types';
import { Type } from 'class-transformer';

export {
  EXPERIMENT_SEARCH_KEY,
  SORT_AS_DIRECTION,
  EXPERIMENT_SORT_KEY,
  IExperimentSearchParams,
  IExperimentSortParams,
  SegmentValidator,
};

class PayloadValidator {
  @IsNotEmpty()
  @IsEnum(PAYLOAD_TYPE)
  public type: PAYLOAD_TYPE;

  // @IsOptional()
  @IsString()
  public value: string;
}

class LevelValidator {
  @IsNotEmpty()
  @IsString()
  public id: string;

  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsOptional()
  @IsString()
  public description?: string;

  @IsOptional()
  @IsInt()
  public order?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PayloadValidator)
  public payload: PayloadValidator;
}

class LevelCombinationElementValidator {
  @IsNotEmpty()
  @IsString()
  public id: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LevelValidator)
  public level: LevelValidator;
}

export class FactorValidator {
  @IsOptional()
  @IsString()
  public id?: string;

  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsOptional()
  @IsString()
  public description?: string;

  @IsNotEmpty()
  @IsInt()
  public order: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LevelValidator)
  public levels: LevelValidator[];
}

export class ConditionValidator {
  @IsNotEmpty()
  @IsString()
  public id: string;

  @IsAlphanumeric()
  @IsOptional()
  @MinLength(2)
  @MaxLength(2)
  public twoCharacterId?: string;

  @IsOptional()
  @IsString()
  public description?: string;

  @IsOptional()
  @IsString()
  public name?: string;

  @IsNotEmpty()
  @IsString()
  public conditionCode: string;

  @IsNotEmpty()
  @IsNumber()
  public assignmentWeight: number;

  @IsNotEmpty()
  @IsInt()
  public order: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LevelCombinationElementValidator)
  public levelCombinationElements?: LevelCombinationElementValidator[];
}
export class PartitionValidator {
  @IsNotEmpty()
  @IsString()
  public id: string;

  @IsOptional()
  @MinLength(2)
  @MaxLength(2)
  public twoCharacterId?: string;

  @IsNotEmpty()
  @IsString()
  public site: string;

  @IsOptional()
  @IsString()
  public target?: string;

  @IsOptional()
  @IsString()
  public description?: string;

  @IsNotEmpty()
  @IsInt()
  public order: number;

  @IsNotEmpty()
  @IsBoolean()
  public excludeIfReached: boolean;
}

abstract class BaseConditionPayloadValidator {
  @IsNotEmpty()
  @IsString()
  public id: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PayloadValidator)
  public payload: PayloadValidator;
}

export class ConditionPayloadValidator extends BaseConditionPayloadValidator {
  @IsNotEmpty()
  @IsString()
  public parentCondition: string;

  @IsOptional()
  @IsString()
  public decisionPoint?: string;
}

class OldConditionPayloadValidator extends BaseConditionPayloadValidator {
  @IsNotEmpty()
  @IsString()
  public parentCondition: ConditionValidator;

  @IsOptional()
  @IsString()
  public decisionPoint?: PartitionValidator;
}

class MetricValidator {
  @IsNotEmpty()
  @IsString()
  public key: string;
}

export class QueryValidator {
  @IsString()
  @IsOptional()
  public id: string;

  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsObject()
  @IsNotEmpty()
  public query: object;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MetricValidator)
  public metric: MetricValidator;

  @IsNotEmpty()
  @IsEnum(REPEATED_MEASURE)
  public repeatedMeasure: REPEATED_MEASURE;
}

class User {
  @IsNotEmpty()
  @IsString()
  public userId: string;
}

class Group {
  @IsNotEmpty()
  @IsString()
  public groupId: string;

  @IsNotEmpty()
  @IsString()
  public type: string;
}

class SubSegment {
  @IsNotEmpty()
  @IsString()
  public id: string;
}

class SegmentValidator {
  @IsString()
  @IsOptional()
  public id?: string;

  @IsString()
  @IsOptional()
  public name?: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsString()
  @IsOptional()
  public context?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => User)
  public individualForSegment?: User[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Group)
  public groupForSegment?: Group[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubSegment)
  public subSegments?: SubSegment[];

  @IsString()
  @IsEnum(SEGMENT_TYPE)
  public type: SEGMENT_TYPE;
}
export class ParticipantsValidator {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SegmentValidator)
  public segment: SegmentValidator;
}

class StateTimeLogValidator {
  @IsNotEmpty()
  @IsString()
  public id: string;

  @IsNotEmpty()
  @IsEnum(EXPERIMENT_STATE)
  public fromState: EXPERIMENT_STATE;

  @IsNotEmpty()
  @IsEnum(EXPERIMENT_STATE)
  public toState: EXPERIMENT_STATE;

  @IsNotEmpty()
  @IsDateString()
  public timeLog: Date;
}

class StratificationFactor {
  @IsString()
  @IsNotEmpty()
  public stratificationFactorName: string;
}

abstract class BaseExperimentWithoutPayload {
  @IsString()
  @IsOptional()
  public id?: string;

  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  public context: string[];

  @IsNotEmpty()
  @IsEnum(EXPERIMENT_STATE)
  public state: EXPERIMENT_STATE;

  @IsOptional()
  @IsDateString()
  public startOn?: Date;

  @ValidateIf((o) => o.assignmentUnit !== ASSIGNMENT_UNIT.WITHIN_SUBJECTS)
  @IsNotEmpty()
  @IsEnum(CONSISTENCY_RULE)
  public consistencyRule: CONSISTENCY_RULE;

  @IsNotEmpty()
  @IsEnum(ASSIGNMENT_UNIT)
  public assignmentUnit: ASSIGNMENT_UNIT;

  @IsNotEmpty()
  @IsEnum(POST_EXPERIMENT_RULE)
  public postExperimentRule: POST_EXPERIMENT_RULE;

  @IsOptional()
  @IsEnum(ASSIGNMENT_ALGORITHM)
  public assignmentAlgorithm?: ASSIGNMENT_ALGORITHM;

  // TODO add conditional validity here ie endOn is null
  @IsOptional()
  public enrollmentCompleteCondition?: Partial<IEnrollmentCompleteCondition>;

  @IsOptional()
  @IsDateString()
  public endOn?: Date;

  @IsOptional()
  @IsString()
  public revertTo?: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  public tags: string[];

  @IsOptional()
  @IsString()
  public group?: string;

  @ValidateIf((o) => o.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS)
  @IsNotEmpty()
  @IsEnum(CONDITION_ORDER)
  public conditionOrder?: CONDITION_ORDER;

  @IsNotEmpty()
  @IsEnum(FILTER_MODE)
  public filterMode: FILTER_MODE;

  @IsOptional()
  @ValidateNested()
  @Type(() => StratificationFactor)
  public stratificationFactor?: StratificationFactor;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionValidator)
  public conditions: ConditionValidator[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FactorValidator)
  public factors?: FactorValidator[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartitionValidator)
  public partitions: PartitionValidator[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QueryValidator)
  public queries?: QueryValidator[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StateTimeLogValidator)
  public stateTimeLogs?: StateTimeLogValidator[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ParticipantsValidator)
  public experimentSegmentInclusion: ParticipantsValidator;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ParticipantsValidator)
  public experimentSegmentExclusion: ParticipantsValidator;

  @IsOptional()
  @IsString()
  public backendVersion?: string;

  @IsNotEmpty()
  @IsEnum(EXPERIMENT_TYPE)
  public type: EXPERIMENT_TYPE;
}

const isMoocletAssignmentAlgorithm = (experiment: ExperimentDTO) =>
  experiment.assignmentAlgorithm && SUPPORTED_MOOCLET_ALGORITHMS.includes(experiment.assignmentAlgorithm);

export class ExperimentDTO extends BaseExperimentWithoutPayload {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionPayloadValidator)
  public conditionPayloads?: ConditionPayloadValidator[];

  // This should be validated when assignmentAlgorithm is not RANDOM or STRATIFIED_RANDOM_SAMPLING
  @ValidateIf(isMoocletAssignmentAlgorithm)
  @IsDefined()
  @ValidateNested()
  @Type(() => MoocletPolicyParametersDTO, {
    discriminator: {
      property: 'assignmentAlgorithm',
      subTypes: [
        { value: MoocletTSConfigurablePolicyParametersDTO, name: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE },
        // Other policy types can be added here
      ],
    },
    keepDiscriminatorProperty: true,
  })
  public moocletPolicyParameters?: MoocletPolicyParametersDTO;

  @ValidateIf(isMoocletAssignmentAlgorithm)
  @IsDefined()
  public rewardMetricKey?: string;
}

export class OldExperimentDTO extends BaseExperimentWithoutPayload {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OldConditionPayloadValidator)
  public conditionPayloads?: OldConditionPayloadValidator[];
}

export class ExperimentIdValidator {
  @IsNotEmpty()
  @IsUUID()
  public id: string;
}

export interface ExperimentFile {
  fileName: string;
  fileContent: string;
}

export interface ValidatedExperimentError {
  fileName: string;
  error: string;
}
