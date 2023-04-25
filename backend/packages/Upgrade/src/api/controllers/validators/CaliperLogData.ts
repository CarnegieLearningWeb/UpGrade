import { IsNotEmpty, IsDefined, IsString, IsJSON, IsObject } from 'class-validator';
import { Attempt, CaliperActor, ScoreObject, SUPPORTED_CALIPER_EVENTS, SUPPORTED_CALIPER_PROFILES } from 'upgrade_types';

export class CaliperLogData {

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public profile: SUPPORTED_CALIPER_PROFILES;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public type: SUPPORTED_CALIPER_EVENTS;

  @IsDefined()
  @IsNotEmpty()
  @IsJSON()
  public actor: CaliperActor;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public action: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public eventTime: string;

  @IsDefined()
  @IsNotEmpty()
  @IsJSON()
  public object: Attempt;

  @IsObject()
  public extensions: Record<string, unknown>;

  @IsObject()
  @IsNotEmpty()
  @IsJSON()
  public generated: ScoreObject;

}