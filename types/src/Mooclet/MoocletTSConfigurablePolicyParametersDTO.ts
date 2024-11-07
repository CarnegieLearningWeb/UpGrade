import { IsNumber, IsString, ValidateNested, IsOptional, IsObject, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';

class Prior {
  @IsDefined()
  @IsNumber()
  @Type(() => Number)
  failure: number = 1;

  @IsDefined()
  @IsNumber()
  @Type(() => Number)
  success: number = 1;
}

class CurrentPosteriors {
  @IsNumber()
  @Type(() => Number)
  failures: number;

  @IsNumber()
  @Type(() => Number)
  successes: number;
}

export class MoocletTSConfigurablePolicyParametersDTO {
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
  batch_size: number = 1;

  @IsNumber()
  max_rating: number = 1;

  @IsNumber()
  min_rating: number = 0;

  @IsNumber()
  uniform_threshold: number = 0;

  @IsNumber()
  tspostdiff_thresh: number = 0;

  @IsDefined()
  @IsString()
  outcome_variable_name: string = undefined;
}