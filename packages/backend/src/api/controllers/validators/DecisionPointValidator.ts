import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * One decision point, as a request names it. A target of '' is the targetless decision point at site, which is a
 * different decision point from any targeted one there, never a wildcard over them.
 */
export interface DecisionPointRef {
  site: string;
  target: string;
}

/**
 * Validates a client-sent decision point. An omitted or null target becomes '', the targetless decision point, so
 * everything past validation can compare targets directly.
 */
export class DecisionPointValidator implements DecisionPointRef {
  @IsString()
  @IsNotEmpty()
  public site: string;

  @Transform(({ value }) => value ?? '')
  @IsString()
  public target = '';
}
