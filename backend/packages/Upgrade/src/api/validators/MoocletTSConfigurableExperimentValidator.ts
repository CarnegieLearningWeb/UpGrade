import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, ValidateNested, IsOptional, IsString } from 'class-validator';
import {
  MoocletTSConfigurablePrior,
  MoocletTSConfigurablePolicyParameters,
  MoocletTSConfigurableCurrentPosteriors,
} from 'upgrade_types';

export class MoocletTSConfigurablePriorValidator {
  @IsNotEmpty()
  @IsNumber()
  public failure: number;

  @IsNotEmpty()
  @IsNumber()
  public success: number;
}

export class MoocletTSConfigurableCurrentPosteriorsValidator {
  [key: string]: {
    failures: number;
    successes: number;
  };
}

export class MoocletTSConfigurablePolicyParametersValidator
  extends MoocletPolicyParameters
  implements MoocletTSConfigurablePolicyParameters
{
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoocletTSConfigurablePriorValidator)
  public prior: MoocletTSConfigurablePrior;

  @IsOptional()
  @ValidateNested()
  @Type(() => MoocletTSConfigurableCurrentPosteriorsValidator)
  public current_posteriors?: MoocletTSConfigurableCurrentPosteriors;

  @IsNotEmpty()
  @IsNumber()
  public batch_size: number;

  @IsNotEmpty()
  @IsNumber()
  public max_rating: number;

  @IsNotEmpty()
  @IsNumber()
  public min_rating: number;

  @IsNotEmpty()
  @IsNumber()
  public uniform_threshold: number;

  @IsNotEmpty()
  @IsNumber()
  public tspostdiff_thresh: number;

  @IsNotEmpty()
  @IsString()
  public outcome_variable_name: string;
}
