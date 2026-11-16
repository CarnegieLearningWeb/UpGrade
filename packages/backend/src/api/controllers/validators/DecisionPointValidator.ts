import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * One decision point, as a request names it. A target of '' is the targetless decision point.
 */
export interface DecisionPointRef {
  site: string;
  target: string;
}

/**
 * Validates a client-sent decision point. An omitted or null target becomes ''.
 */
export class DecisionPointValidator implements DecisionPointRef {
  @IsString()
  @IsNotEmpty()
  public site: string;

  @Transform(({ value }) => value ?? '')
  @IsString()
  public target = '';
}
