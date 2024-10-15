import { MoocletPolicyParameters } from 'types/src';
import { ExperimentDTO } from './ExperimentDTO';

export class MoocletExperimentDTO extends ExperimentDTO {
  public moocletPolicyParameters: MoocletPolicyParameters;
}
