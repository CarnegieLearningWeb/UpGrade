import { IsNotEmpty, IsDefined, IsString, IsJSON, IsObject } from 'class-validator';
import { Assessment, AssessmentObject } from '../../../../../../../types/src/Experiment/interfaces';
import { ExperimentUser } from '../../../../src/api/models/ExperimentUser';

export class CaliperLogValidator {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public assessment: Assessment;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public profile: string;

  @IsDefined()
  @IsNotEmpty()
  @IsJSON()
  public actor: ExperimentUser;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public action: string;

  @IsDefined()
  @IsNotEmpty()
  @IsJSON()
  public object: AssessmentObject;

  @IsObject()
  public extensions: object;

}
