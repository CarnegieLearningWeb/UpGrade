import { IsNotEmpty, IsDefined, IsString, IsJSON, IsObject } from 'class-validator';
import { Attempt, ScoreObject } from '../../../../../../../types/src/Experiment/interfaces';
import { ExperimentUser } from '../../../../src/api/models/ExperimentUser';

export class CaliperLogValidator {

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
  public object: Attempt;

  @IsObject()
  public extensions: object;

  @IsObject()
  @IsNotEmpty()
  @IsJSON()
  public generated: ScoreObject;

}
