import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { DecisionPointValidator } from './DecisionPointValidator';

export class ExperimentAssignmentValidatorv6 {
  @IsNotEmpty()
  @IsString()
  public context: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DecisionPointValidator)
  public decisionPoint?: DecisionPointValidator;
}
