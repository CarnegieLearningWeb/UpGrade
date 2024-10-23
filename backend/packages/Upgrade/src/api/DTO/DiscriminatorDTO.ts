import { Type } from 'class-transformer';
import { IsDefined, IsNumber, IsObject, ValidateNested } from 'class-validator';

enum SupportedMoocletPolicyNames {
  WEIGHTED_RANDOM = 'weighted_random',
  TS_CONFIGURABLE = 'ts_configurable',
}

abstract class PolicyParameter {}

class MoocletWeightedRandomPolicyParameters extends PolicyParameter {
  @IsDefined()
  @IsObject()
  public probability_distribution: {
    [key: string]: number;
  };

  constructor() {
    super();
  }
}

class MoocletThompsonSamplingConfigurablePolicyParameters extends PolicyParameter {
  public prior: {
    failure: number; // use 1 as default
    success: number; // use 1 as default
  };
  // current_posteriors will show up after first reward is given
  // BUT if you wanted to set different priors for different arms, you could do that by setting current_posteriors manually
  public current_posteriors?: MoocletThompsonSamplingConfigurableCurrentPosteriors;

  @IsDefined()
  @IsNumber()
  public batch_size: number; // for now leave at 1

  public max_rating: number; // leave at 1
  public min_rating: number; // leave at 0
  public uniform_threshold: number; // leave at 0
  public tspostdiff_thresh: number; // ignore this (or leave at 0)
  public outcome_variable_name: string;

  constructor() {
    super();
  }
}

class MoocletThompsonSamplingConfigurableCurrentPosteriors {
  [key: string]: {
    failures: number;
    successes: number;
  };
}

export class DiscriminatorDTO {
  // Experiment Type will come here
  type: string;

  // Selected Policy will come here
  policyName: SupportedMoocletPolicyNames;

  // Policy JSON will come here
  @ValidateNested()
  @Type(() => PolicyParameter, {
    discriminator: {
      property: 'policyName',
      subTypes: [
        { value: MoocletWeightedRandomPolicyParameters, name: SupportedMoocletPolicyNames.WEIGHTED_RANDOM },
        {
          value: MoocletThompsonSamplingConfigurablePolicyParameters,
          name: SupportedMoocletPolicyNames.TS_CONFIGURABLE,
        },
      ],
    },
  })
  policyParameterConfig: MoocletWeightedRandomPolicyParameters | MoocletThompsonSamplingConfigurablePolicyParameters;
}


// Valid JSON
// {
//     "type": "Moocket Experiment",
//     "policyName": "weighted_random",
//     "policyParameterConfig": {
//         "policyName": "weighted_random",
//         "probability_distribution": {
//             "data": "here"
//         }
//     }
// }


// Invalid JSON
// {
//     "type": "Moocket Experiment",
//     "policyName": "weighted_random",
//     "policyParameterConfig": {
//         "policyName": "weighted_random"
//     }
// }
