import { IsNotEmpty, IsDefined, ValidateNested, IsOptional, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Experiment } from '../../../../src/api/models/Experiment';
import { ExperimentCondition } from '../../../../src/api/models/ExperimentCondition';

class ExplicitIndividualAssignment {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public id: string;

  @IsOptional()
  public experimentCondition?: ExperimentCondition;

  @IsOptional()
  public experiment?: Experiment;
}

export class PreviewUserValidator{
  @IsOptional()
  @IsString()
  public id?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => ExplicitIndividualAssignment)
  public assignments?: ExplicitIndividualAssignment[];
}
