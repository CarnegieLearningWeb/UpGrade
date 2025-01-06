import { IsDefined, IsIn } from 'class-validator';
import { ASSIGNMENT_ALGORITHM } from '../Experiment/enums';

// this will be a Union type of all possible policy parameters once more are introduced
export abstract class MoocletPolicyParametersDTO {
  @IsDefined()
  @IsIn(Object.values(ASSIGNMENT_ALGORITHM))
  assignmentAlgorithm: ASSIGNMENT_ALGORITHM;
}
