import { IsNotEmpty, IsDefined, IsEnum, ValidateNested } from 'class-validator';
import { CONSISTENCY_RULE, ASSIGNMENT_UNIT, POST_EXPERIMENT_RULE, EXPERIMENT_STATE } from 'ees_types';
import { ExperimentConditionValidator } from './ExperimentConditionValidator';
import { ExperimentSegmentValidator } from './ExperimentSegmentValidator';
import { Type } from 'class-transformer';

export class ExperimentValidator {
  @IsNotEmpty()
  @IsDefined()
  public name: string;

  public description: string;

  @IsNotEmpty()
  @IsDefined()
  @IsEnum(CONSISTENCY_RULE)
  public consistencyRule: CONSISTENCY_RULE;

  @IsNotEmpty()
  @IsDefined()
  @IsEnum(ASSIGNMENT_UNIT)
  public assignmentUnit: ASSIGNMENT_UNIT;

  @IsNotEmpty()
  @IsDefined()
  @IsEnum(POST_EXPERIMENT_RULE)
  public postExperimentRule: POST_EXPERIMENT_RULE;

  @IsNotEmpty()
  @IsDefined()
  @IsEnum(EXPERIMENT_STATE)
  public state: EXPERIMENT_STATE;

  public group: string;

  @ValidateNested() @Type(() => ExperimentConditionValidator) public conditions: ExperimentConditionValidator[];

  @ValidateNested() @Type(() => ExperimentSegmentValidator) public segments: ExperimentSegmentValidator[];
}
