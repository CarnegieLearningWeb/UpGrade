import { Service } from 'typedi';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { ExperimentDTO } from '../DTO/ExperimentDTO';
import { MoocletDataService } from './MoocletDataService';

/**********************************************************************
 * types for the test MOOClet services. I don't know where to put these so they're here still!
 */
export interface MoocletRequestBody {
  name: string;
  policy: number;
}

export interface MoocletResponseDetails {
  id: number;
  name: string;
  policy: number;
  mooclet_id?: string;
  environment?: string;
}

export interface MoocletVersionRequestBody {
  mooclet: number;
  name: string;
  text?: string;
  version_json?: any;
}

export interface MoocletVersionResponseDetails {
  id: number;
  name: string;
  mooclet: number;
  version_id?: number;
  text?: string;
  version_json?: Record<keyof string, 0 | 1>;
}

export interface MoocletPolicyParametersRequestBody {
  mooclet: number;
  policy: number;
  parameters: MoocletPolicyParameters;
}

// {"probability_distribution": {"testtest_arm1": 0.7, "testtest_arm2": 0.3}} #weighted random
export interface MoocletPolicyParametersResponseDetails {
  id: number;
  mooclet: number;
  policy: number;
  parameters: MoocletPolicyParameters;
}

// {"prior": {"failure": 1, "success": 1}, "batch_size": 4, "max_rating": 1, "min_rating": 0, "uniform_threshold": 8, "outcome_variable_name": ""} #TS parameters
export interface MoocletWeightedRandomPolicyParameters {
  probability_distribution: {
    [key: string]: number;
  };
}

export interface MoocletThompsonSamplingConfigurablePolicyParameters {
  prior: {
    failure: number;
    success: number;
  };
  current_posteriors?: any; // what is this shape
  batch_size: number;
  max_rating: number;
  min_rating: number;
  uniform_threshold: number;
  outcome_variable_name: string;
}

export type MoocletPolicyParameters =
  | MoocletWeightedRandomPolicyParameters
  | MoocletThompsonSamplingConfigurablePolicyParameters;

// {"prior": {"failure": 1, "success": 1}, "batch_size": 4, "max_rating": 1, "min_rating": 0, "uniform_threshold": 4, "current_posteriors": {"16": {"failures": 5.0, "successes": 5.0}, "17": {"failures": 4.0, "successes": 3.0}}, "outcome_variable_name": "XPRIZE_EXPLANATION_AD_REWARD"} #TS parameters with current posteriors for different arms (versions)

export interface MoocletPolicyResponseDetails {
  id: number;
  name: string;
  environment?: string;
}

export interface MoocletExperimentDataSummary {
  mooclet: MoocletResponseDetails;
  versions: MoocletVersionResponseDetails[];
  policyParameters: MoocletPolicyParametersResponseDetails;
}

export interface MoocletBatchResponse<T> {
  count: number;
  next: string;
  previous: string;
  results: T[];
}

export enum MoocletPolicyNames {
  WEIGHTED_RANDOM = 'weighted_random',
  UNIFORM_RANDOM = 'uniform_random',
  THOMPSON_SAMPLING = 'thompson_sampling',
  TS_CONFIGURABLE = 'ts_configurable',
  CHOOSE_POLICY_GROUP = 'choose_policy_group',
}

@Service()
export class MoocletTestService {
  constructor(private moocletDataService: MoocletDataService) {}
  /**
   * To be called when a new experiment is created and useMooclet is true
   * So far it will create a mooclet with weighted-random policy and associate versions.
   *
   * Goal is to create a mooclet with versions and policyparameters.
   * On Success: This should return an object of details about the new mooclet that can be saved to the experiment json.
   * On Failure: This should return an error messaage and the experiment should not be created.
   *
   * TODO: after create is working, do the experiment runtime POC through assign
   * TODO: create an architectrual diagram of this flow in UpGrade
   */
  public async orchestrateMoocletCreation(UpgradeExperiment: ExperimentDTO): Promise<MoocletExperimentDataSummary> {
    const { conditions: upgradeConditions, name: upgradeName } = UpgradeExperiment;
    let moocletResponse: MoocletResponseDetails = null;
    let moocletVersionsResponse: MoocletVersionResponseDetails[] = null;
    let moocletPolicyParametersResponse: MoocletPolicyParametersResponseDetails = null;

    const newMoocletRequest: MoocletRequestBody = {
      name: upgradeName,
      policy: null,
    };

    try {
      // Step 0: get policy id by policy name. id and policy name could change.
      newMoocletRequest.policy = await this.moocletDataService.getMoocletIdByName(MoocletPolicyNames.TS_CONFIGURABLE);

      console.log('* newMoocletRequest **************************************************');
      console.log(newMoocletRequest);

      // Step 1: create mooclet w/ policy
      moocletResponse = await this.moocletDataService.postNewMooclet(newMoocletRequest);

      // Step 2: create versions
      if (moocletResponse.id) {
        moocletVersionsResponse = await Promise.all(
          upgradeConditions.map(async (condition, index) => this.createNewVersion(condition, moocletResponse, index))
        );

        console.log('* moocletVersionsResponse **************************************************');
        console.log(moocletVersionsResponse);
      }

      // Step 3: associate version weights and other policy parameters
      if (moocletVersionsResponse) {
        const policyParametersRequest: MoocletPolicyParametersRequestBody = {
          mooclet: moocletResponse.id,
          policy: moocletResponse.policy,
          // parameters: this.createWeightedRandomParameters(moocletVersionsResponse, upgradeConditions),

          // hardcode TS Configurable parameters for now
          parameters: {
            prior: {
              failure: 0,
              success: 0,
            },
            batch_size: 4,
            max_rating: 1,
            min_rating: 0,
            uniform_threshold: 4,
            outcome_variable_name: 'test_outcome_variable_name',
          },
        };

        moocletPolicyParametersResponse = await this.moocletDataService.postNewPolicyParameters(
          policyParametersRequest
        );

        console.log('* moocletPolicyParametersResponse **************************************************');
        console.log(moocletPolicyParametersResponse);
      }

      // Step 4: if all has succeeded, insert the mooclet details in the experiment json
      if (moocletResponse && moocletVersionsResponse && moocletPolicyParametersResponse) {
        const moocletExperimentDataSummary: MoocletExperimentDataSummary = {
          mooclet: moocletResponse,
          versions: moocletVersionsResponse,
          policyParameters: moocletPolicyParametersResponse,
        };

        console.log('***************************************************');
        console.log(moocletExperimentDataSummary);

        return moocletExperimentDataSummary;
      } else {
        console.log(moocletResponse);
        console.log(moocletVersionsResponse);
        console.log(moocletPolicyParametersResponse);
        throw new Error('Mooclet creation failed:');
      }
    } catch (err) {
      console.log(err);
      throw new Error('Mooclet creation failed');
    }
  }

  private createWeightedRandomParameters(
    moocletVersions: MoocletVersionResponseDetails[],
    upgradeConditions: ExperimentCondition[]
  ): MoocletPolicyParameters {
    const probability_distribution = moocletVersions.reduce((probability_distribution_obj, moocletVersion) => {
      const upgradeCondition = this.getConditionNameByVersionName(moocletVersion.name, upgradeConditions);
      probability_distribution_obj[moocletVersion.name] = upgradeCondition.assignmentWeight / 100;
      return probability_distribution_obj;
    }, {});

    const parameters: MoocletPolicyParameters = {
      probability_distribution,
    };

    return parameters;
  }

  private getConditionNameByVersionName(versionName: string, conditions: ExperimentCondition[]): ExperimentCondition {
    return conditions.find((condition) => condition.conditionCode === versionName);
  }

  private async createNewVersion(
    upgradeCondition: ExperimentCondition,
    mooclet: MoocletResponseDetails,
    index: number
  ): Promise<MoocletVersionResponseDetails> {
    const newVersionRequest: MoocletVersionRequestBody = {
      mooclet: mooclet.id,
      name: upgradeCondition.conditionCode,
      text: upgradeCondition.conditionCode,
      version_json: {
        [`${mooclet.name}_VERSION_CONTROL_FLAG`]: index,
      },
    };

    return await this.moocletDataService.postNewVersion(newVersionRequest);
  }
}
