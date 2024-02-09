import { Service } from 'typedi';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { MoocletDataService } from './MoocletDataService';
import { Experiment } from '../models/Experiment';
import { ASSIGNMENT_ALGORITHM } from 'upgrade_types';

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

export interface MoocletVariableRequestBody {
  name: string;
}

export interface MoocletVariableResponseDetails {
  id: number;
  environment?: null;
  variable_id?: null;
  name: string;
  min_value: number;
  max_value: number;
  value_type: 'BIN'; // binary is only supported type, must use 0 or 1
  sample_thres: number;
}

export interface MoocletValueRequestBody {
  variable: string;
  learner?: number;
  value: number;
  mooclet: number;
  version: number;
  policy: number;
}

export interface MoocletValueResponseDetails {
  id: 20;
  variable: 'version';
  learner: 'danqq';
  mooclet: 6;
  version: 12;
  policy: 17;
  value: 12.0;
  text: 'variant';
  timestamp: '2023-12-22T19:51:55.255158Z';
}

export interface ExperimentCondtitionToMoocletVersionParams {
  moocletId: number;
  userId: string;
  experimentConditions: ExperimentCondition[];
}

// {"prior": {"failure": 1, "success": 1}, "batch_size": 4, "max_rating": 1, "min_rating": 0, "uniform_threshold": 8, "outcome_variable_name": ""} #TS parameters
export interface MoocletWeightedRandomPolicyParameters {
  probability_distribution: {
    [key: string]: number;
  };
}

export interface MoocletThompsonSamplingConfigurablePolicyParameters {
  prior: {
    failure: number; // use 1 as default
    success: number; // use 1 as default
  };
  // current_posteriors will show up after first reward is given
  // BUT if you wanted to set different priors for different arms, you could do that by setting current_posteriors manually
  current_posteriors?: MoocletThompsonSamplingConfigurableCurrentPosteriors;
  batch_size: number; // for now leave at 1
  max_rating: number; // leave at 1
  min_rating: number; // leave at 0
  uniform_threshold: number; // leave at 0
  tspostdiff_thresh: number; // ignore this (or leave at 0)
  outcome_variable_name: string;
}

export interface MoocletThompsonSamplingConfigurableCurrentPosteriors {
  [key: string]: {
    failures: number;
    successes: number;
  };
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
  public async orchestrateMoocletCreation(upgradeExperiment: Experiment): Promise<MoocletExperimentDataSummary> {
    const { conditions: upgradeConditions, name: upgradeName, assignmentAlgorithm } = upgradeExperiment;
    let moocletResponse: MoocletResponseDetails = null;
    let moocletVersionsResponse: MoocletVersionResponseDetails[] = null;
    let moocletPolicyParametersResponse: MoocletPolicyParametersResponseDetails = null;
    let moocletVariableResponse: MoocletVariableResponseDetails = null;

    const newMoocletRequest: MoocletRequestBody = {
      name: upgradeName,
      policy: null,
    };

    try {
      // Step 0: get policy id by policy name. id and policy name could change.
      console.log('******asignmentAlgorithm***************************************');
      console.log(assignmentAlgorithm);
      newMoocletRequest.policy = await this.moocletDataService.getMoocletIdByName(assignmentAlgorithm);

      console.log('* newMoocletRequest **************************************************');
      console.log(newMoocletRequest);

      // Step 1: create mooclet w/ policy
      moocletResponse = await this.moocletDataService.postNewMooclet(newMoocletRequest);

      // Step 2: create versions
      if (moocletResponse?.id) {
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
          parameters: this.createPolicyParameters(moocletVersionsResponse, upgradeExperiment, moocletResponse.name),
        };

        moocletPolicyParametersResponse = await this.moocletDataService.postNewPolicyParameters(
          policyParametersRequest
        );

        console.log('* moocletPolicyParametersResponse **************************************************');
        console.log(moocletPolicyParametersResponse);
      }

      // Step 4: associate outcome variable name with variable if TS_CONFIGURABLE

      if (moocletPolicyParametersResponse && assignmentAlgorithm === ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE) {
        const variableRequest: MoocletVariableRequestBody = {
          name: this.createOutcomeVariableName(moocletResponse.name),
        };

        moocletVariableResponse = await this.moocletDataService.postNewVariable(variableRequest);
      }

      // Step 5: if all has succeeded, insert the mooclet details in the experiment json
      if (moocletResponse && moocletVersionsResponse && moocletPolicyParametersResponse && moocletVariableResponse) {
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

  public async getConditionFromMoocletProxy({
    moocletId,
    userId,
    experimentConditions,
  }: ExperimentCondtitionToMoocletVersionParams): Promise<ExperimentCondition> {
    const versionResponse = await this.moocletDataService.getVersionForNewLearner(moocletId, userId);
    const experimentCondition = this.findExperimentConditionFromVersionResponse(versionResponse, experimentConditions);

    console.log('* versionResponse **************************************************');
    console.log(versionResponse);

    return experimentCondition;
  }

  public async syncRewardLogs(userId: string, logs: any): Promise<any> {
    console.log('*************************syncRewardLogs');
    console.log(logs);
    /*
    *[
2024-02-05 13:41:59   {
2024-02-05 13:41:59     timeStamp: 2024-02-05T18:41:58.928Z,
2024-02-05 13:41:59     uniquifier: '1',
2024-02-05 13:41:59     data: { solverBotSuccesses: 1 },
2024-02-05 13:41:59     metrics: [ [Metric] ],
2024-02-05 13:41:59     user: {
2024-02-05 13:41:59       createdAt: 2024-02-05T17:37:13.852Z,
2024-02-05 13:41:59       updatedAt: 2024-02-05T17:37:13.852Z,
2024-02-05 13:41:59       versionNumber: 1,
2024-02-05 13:41:59       id: 'bort6',
2024-02-05 13:41:59       group: [Object],
2024-02-05 13:41:59       workingGroup: null,
2024-02-05 13:41:59       requestedUserId: 'bort6'
2024-02-05 13:41:59     },
2024-02-05 13:41:59     createdAt: 2024-02-05T18:41:58.987Z,
2024-02-05 13:41:59     updatedAt: 2024-02-05T18:41:58.987Z,
2024-02-05 13:41:59     versionNumber: 1,
2024-02-05 13:41:59     id: 12
2024-02-05 13:41:59   }
2024-02-05 13:41:59 ]
    */
    const rewardData = logs[0].data;
    let versionId = null;
    let value = null;

    if (rewardData.solverBotSuccesses) {
      versionId = 19;
      value = 1;
    }

    if (rewardData.solverBotFailures) {
      versionId = 19;
      value = 0;
    }

    if (rewardData.explainerBotSuccesses) {
      versionId = 20;
      value = 1;
    }

    if (rewardData.explainerBotFailures) {
      versionId = 20;
      value = 0;
    }

    const moocletValue = {
      variable: 'TS_CONFIG_TEST_livehint-ts-demo',
      value,
      mooclet: 12,
      version: versionId,
      policy: 17,
    };

    console.log('*************************moocletValue');
    console.log(moocletValue);
    try {
      const moocletResponse = await this.moocletDataService.postNewValue(moocletValue);

      console.log('*************************moocletResponse');
      console.log(moocletResponse);
    } catch (err) {
      console.log(err);
    }
  }

  private findExperimentConditionFromVersionResponse(
    versionResponse: MoocletVersionResponseDetails,
    experimentConditions: ExperimentCondition[]
  ): ExperimentCondition {
    // use version response to find the experiment condtions
    const experimentCondition = experimentConditions.find(
      (condition) => condition.conditionCode === versionResponse.name
    );

    if (!experimentCondition) {
      const error = {
        message: 'Version name not found be found in experiment conditions',
        version: versionResponse,
        conditions: experimentConditions,
      };
      throw new Error(JSON.stringify(error));
    }

    return experimentCondition;
  }

  private createPolicyParameters(
    moocletVersions: MoocletVersionResponseDetails[],
    experiment: Experiment,
    moocletName: string
  ) {
    const assignmentAlgorithm = experiment.assignmentAlgorithm;

    if (assignmentAlgorithm === ASSIGNMENT_ALGORITHM.MOOCLET_UNIFORM_RANDOM) {
      return this.createWeightedRandomParameters(moocletVersions, experiment.conditions);
    } else if (assignmentAlgorithm === ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE) {
      return this.createTSConfigurableParameters(moocletName);
    } else {
      throw new Error(`Assignment algorithm not found: ${assignmentAlgorithm}`);
    }
  }

  private createTSConfigurableParameters(moocletName: string): MoocletPolicyParameters {
    return {
      prior: {
        failure: 1,
        success: 1,
      },
      batch_size: 1,
      max_rating: 1,
      min_rating: 0,
      uniform_threshold: 0,
      tspostdiff_thresh: 0,
      outcome_variable_name: this.createOutcomeVariableName(moocletName),
    };
  }

  private createOutcomeVariableName(moocletName: string): string {
    return 'TS_CONFIG_TEST_' + moocletName;
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
