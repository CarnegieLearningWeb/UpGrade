import { IsNotEmpty, IsString } from 'class-validator';
import { DecisionPointValidator } from './DecisionPointValidator';

// The decision point (site, target) to assign at, plus the context and the users to assign.
export class BatchAssignValidator extends DecisionPointValidator {
  @IsNotEmpty()
  @IsString()
  public context: string;

  @IsNotEmpty()
  @IsString({ each: true })
  public userIds: string[];
}
