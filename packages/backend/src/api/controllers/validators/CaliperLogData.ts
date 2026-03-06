import { IsNotEmpty, IsString, IsJSON, IsObject } from 'class-validator';
import {
  Attempt,
  CaliperActor,
  ScoreObject,
  SUPPORTED_CALIPER_EVENTS,
  SUPPORTED_CALIPER_PROFILES,
} from 'upgrade_types';

export class CaliperLogData {
  @IsNotEmpty()
  @IsString()
  public profile: SUPPORTED_CALIPER_PROFILES;

  @IsNotEmpty()
  @IsString()
  public type: SUPPORTED_CALIPER_EVENTS;

  @IsNotEmpty()
  @IsJSON()
  public actor: CaliperActor;

  @IsNotEmpty()
  @IsString()
  public action: string;

  @IsNotEmpty()
  @IsString()
  public eventTime: string;

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
