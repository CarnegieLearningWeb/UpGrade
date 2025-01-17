import { IsNumber, IsString, ValidateNested, IsOptional, IsObject, IsDefined, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { MoocletPolicyParametersDTO } from './MoocletPolicyParametersDTO';

export class Prior {
  @IsDefined()
  @IsNumber()
  @Type(() => Number)
  failure = 1;

  @IsDefined()
  @IsNumber()
  @Type(() => Number)
  success = 1;
}

export class CurrentPosteriors {
  @IsNumber()
  @Type(() => Number)
  failures: number;

  @IsNumber()
  @Type(() => Number)
  successes: number;
}

export class MoocletTSConfigurablePolicyParametersDTO extends MoocletPolicyParametersDTO {
  @IsDefined()
  @ValidateNested()
  @Type(() => Prior)
  prior: Prior = new Prior();

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => CurrentPosteriors)
  current_posteriors?: Record<string, CurrentPosteriors>;

  @IsNumber()
  batch_size = 1;

  @IsNumber()
  max_rating = 1;

  @IsNumber()
  min_rating = 0;

  @IsNumber()
  uniform_threshold = 0;

  @IsNumber()
  tspostdiff_thresh = 0;

  @IsNotEmpty()
  @IsString()
  outcome_variable_name = 'my_var';
}
