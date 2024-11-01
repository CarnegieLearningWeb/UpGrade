
import { MoocletPolicyParameters } from '../../../src/types/Mooclet';
import { ExperimentDTO } from './ExperimentDTO';

export class MoocletExperimentDTO extends ExperimentDTO {
  public moocletPolicyParameters: MoocletPolicyParameters;
}
