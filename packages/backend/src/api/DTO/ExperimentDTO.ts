import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
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
} from 'upgrade_types';
import { Type, Transform } from 'class-transformer';

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

  @IsNotEmpty()
  @IsString()
  public site: string;

  @Transform(({ value }) => value ?? '')
  @IsString()
  public target = '';

  @IsOptional()
  @IsString()
  public description?: string;

  @IsNotEmpty()
  @IsInt()
  public order: number;

  @IsNotEmpty()
  @IsBoolean()
  public excludeIfReached: boolean;

  @IsOptional()
  @IsBoolean()
  public pendingActivation?: boolean;
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

  @IsOptional()
  @IsInt()
  public order?: number;
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

  @IsOptional()
  @IsString()
  public listType?: string;
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
  @IsAssignmentUnitGroupConsistent()
  public assignmentUnit: ASSIGNMENT_UNIT;

  @IsNotEmpty()
  @IsEnum(POST_EXPERIMENT_RULE)
  public postExperimentRule: POST_EXPERIMENT_RULE;

  @IsOptional()
  @IsEnum(ASSIGNMENT_ALGORITHM)
  @IsAssignmentAlgorithmCompatibleWithUnit()
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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantsValidator)
  public experimentSegmentInclusion: ParticipantsValidator[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantsValidator)
  public experimentSegmentExclusion: ParticipantsValidator[];

  @IsOptional()
  @IsString()
  public backendVersion?: string;

  @IsNotEmpty()
  @IsEnum(EXPERIMENT_TYPE)
  public type: EXPERIMENT_TYPE;
}

function IsAssignmentUnitGroupConsistent(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isAssignmentUnitGroupConsistent',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(assignmentUnitValue: any, args: ValidationArguments) {
          const experiment = args.object as any;
          const groupValue = experiment.group;

          if (assignmentUnitValue === ASSIGNMENT_UNIT.GROUP) {
            // When assignmentUnit is GROUP, group must be a non-empty string
            return groupValue && typeof groupValue === 'string';
          } else {
            // When assignmentUnit is not GROUP, group must be null or undefined
            return !groupValue;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return 'When assignmentUnit is GROUP, group must be defined. When assignmentUnit is not GROUP, group must be null or undefined.';
        },
      },
    });
  };
}

/**
 * Within-Subjects assignment never runs through assignExperiment()/assignThompsonSampling() --
 * the individual enrollment's condition is always stored as null, with the per-repeat condition
 * tracked separately via RepeatedEnrollment instead. Thompson Sampling's reward path then reads
 * that null conditionId when trying to record a reward, which can never succeed. Reject the
 * combination outright rather than let it silently produce an experiment whose rewards can never
 * be recorded.
 */
function IsAssignmentAlgorithmCompatibleWithUnit(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isAssignmentAlgorithmCompatibleWithUnit',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(assignmentAlgorithmValue: any, args: ValidationArguments) {
          const experiment = args.object as any;
          return !(
            assignmentAlgorithmValue === ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING &&
            experiment.assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS
          );
        },
        defaultMessage() {
          return 'Thompson Sampling cannot be used with Within-Subjects assignment: rewards cannot be attributed to a condition under that assignment unit.';
        },
      },
    });
  };
}

const MAX_NUMBER_INPUT = 1_000_000;
const MIN_PRIOR_VALUE = 1;

function IsThompsonSamplingPriorsRecord(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isThompsonSamplingPriorsRecord',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value === undefined || value === null) {
            return true;
          }
          if (typeof value !== 'object' || Array.isArray(value)) {
            return false;
          }
          return Object.values(value).every((prior: any) => {
            if (typeof prior !== 'object' || prior === null) {
              return false;
            }
            const { success, failure } = prior;
            return (
              Number.isInteger(success) &&
              success >= MIN_PRIOR_VALUE &&
              success <= MAX_NUMBER_INPUT &&
              Number.isInteger(failure) &&
              failure >= MIN_PRIOR_VALUE &&
              failure <= MAX_NUMBER_INPUT
            );
          });
        },
        defaultMessage() {
          return (
            'Each entry in priors must have integer success/failure values between ' +
            `${MIN_PRIOR_VALUE} and ${MAX_NUMBER_INPUT}.`
          );
        },
      },
    });
  };
}

class ThompsonSamplingConfigValidator {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_NUMBER_INPUT)
  public warmupThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  public minimumDrawDifference?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_NUMBER_INPUT)
  public batchSize?: number;

  @IsOptional()
  @IsThompsonSamplingPriorsRecord()
  public priors?: Record<string, { success: number; failure: number }>;
}

export class ExperimentDTO extends BaseExperimentWithoutPayload {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionPayloadValidator)
  public conditionPayloads?: ConditionPayloadValidator[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ThompsonSamplingConfigValidator)
  public thompsonSamplingConfig?: ThompsonSamplingConfigValidator;
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
