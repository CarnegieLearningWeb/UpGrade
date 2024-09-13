import { Service } from 'typedi';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { MoocletDataService } from './MoocletDataService';
import {
  ASSIGNMENT_ALGORITHM,
  ExperimentCondtitionToMoocletVersionParams,
  MoocletDetails,
  MoocletPolicyParametersRequestBody,
  MoocletPolicyParametersResponseDetails,
  MoocletRequestBody,
  MoocletResponseDetails,
  MoocletVariableRequestBody,
  MoocletVariableResponseDetails,
  MoocletVersionRequestBody,
  MoocletVersionResponseDetails,
} from 'upgrade_types';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { ExperimentDTO } from '../DTO/ExperimentDTO';

@Service()
export class MoocletService {
  constructor(private moocletDataService: MoocletDataService) {}

  /**
   * orchestrateMoocletCreation: Sequential calls needed to create of a new Mooclet experiment from experiment data and supplied policy parameters
   *
   * 1. Retrieves the Mooclet policy ID based on the assignment algorithm.
   * 2. Creates a new Mooclet experiment with name an policy ID.
   * 3. Creates Mooclet versions for each Experiment condition
   * 4. Creates Policy Parameters
   * 5. Creates a variable if needed based on the assignment algorithm and policy parameters.
   * 6. Constructs and returns the Mooclet experiment reference if all steps were successful.
   */

  public async orchestrateMoocletCreation(
    upgradeExperiment: Omit<ExperimentDTO, 'createdAt' | 'updatedAt' | 'versionNumber'>,
    logger: UpgradeLogger
  ): Promise<MoocletDetails> {
    const { conditions: upgradeConditions, name: upgradeName, assignmentAlgorithm } = upgradeExperiment;

    const newMoocletRequest: MoocletRequestBody = {
      name: upgradeName,
      policy: null,
    };

    logger.debug({
      message: '[Mooclet Creation] 0. Starting Mooclet creation process',
      upgradeExperiment: JSON.stringify(upgradeExperiment),
    });

    try {
      newMoocletRequest.policy = await this.getMoocletPolicy(assignmentAlgorithm);
      logger.debug({
        message: `[Mooclet Creation] 1. Mooclet created:`,
        newMoocletRequest: JSON.stringify(newMoocletRequest),
      });

      const moocletResponse = await this.createMooclet(newMoocletRequest);
      logger.debug({
        message: `[Mooclet Creation] 2. Mooclet created:`,
        moocletResponse: JSON.stringify(moocletResponse),
      });

      const moocletVersionsResponse = await this.createMoocletVersions(upgradeConditions, moocletResponse);
      logger.debug({
        message: `[Mooclet Creation] 3. Mooclet versions created:`,
        moocletVersionsResponse: JSON.stringify(moocletVersionsResponse),
      });

      const moocletPolicyParametersResponse = await this.createPolicyParameters(moocletResponse, upgradeExperiment);
      logger.debug({
        message: `[Mooclet Creation] 4. Policy parameters created:`,
        moocletPolicyParametersResponse: JSON.stringify(moocletPolicyParametersResponse),
      });

      const moocletVariableResponse = await this.createVariableIfNeeded(
        moocletPolicyParametersResponse,
        assignmentAlgorithm,
        moocletResponse
      );
      logger.debug({
        message: `[Mooclet Creation] 5. Variable created (if needed):`,
        moocletVariableResponse: JSON.stringify(moocletVariableResponse),
      });

      return this.constructMoocletDetails(moocletResponse, moocletVersionsResponse, moocletPolicyParametersResponse);
    } catch (err) {
      throw new Error(
        JSON.stringify({
          message: 'Mooclet creation failed. See sequence of events in logs for more details.',
          error: err,
        })
      );
    }
  }

  private async getMoocletPolicy(assignmentAlgorithm: string): Promise<number> {
    try {
      return await this.moocletDataService.getMoocletIdByName(assignmentAlgorithm);
    } catch (err) {
      throw new Error(`Failed to get Mooclet policy: ${err}`);
    }
  }

  private async createMooclet(newMoocletRequest: MoocletRequestBody): Promise<MoocletResponseDetails> {
    try {
      return await this.moocletDataService.postNewMooclet(newMoocletRequest);
    } catch (err) {
      throw new Error(`Failed to get Mooclet policy: ${err}`);
    }
  }

  private async createMoocletVersions(
    upgradeConditions: any[],
    moocletResponse: MoocletResponseDetails
  ): Promise<MoocletVersionResponseDetails[]> {
    if (!moocletResponse?.id) return null;

    try {
      return await Promise.all(
        upgradeConditions.map(async (condition, index) => this.createNewVersion(condition, moocletResponse, index))
      );
    } catch (err) {
      throw new Error(`Failed to create Mooclet versions: ${err}`);
    }
  }

  private async createPolicyParameters(
    moocletResponse: MoocletResponseDetails,
    upgradeExperiment: Omit<ExperimentDTO, 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<MoocletPolicyParametersResponseDetails> {
    if (!moocletResponse) return null;

    const policyParametersRequest: MoocletPolicyParametersRequestBody = {
      mooclet: moocletResponse.id,
      policy: moocletResponse.policy,
      parameters: upgradeExperiment.moocletDetails.policyParameters,
    };

    try {
      return await this.moocletDataService.postNewPolicyParameters(policyParametersRequest);
    } catch (err) {
      throw new Error(`Failed to create policy parameters: ${err}`);
    }
  }

  private async createVariableIfNeeded(
    moocletPolicyParametersResponse: MoocletPolicyParametersResponseDetails,
    assignmentAlgorithm: string,
    moocletResponse: MoocletResponseDetails
  ): Promise<MoocletVariableResponseDetails> {
    if (!moocletPolicyParametersResponse || assignmentAlgorithm !== ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE)
      return null;

    const variableRequest: MoocletVariableRequestBody = {
      name: this.createOutcomeVariableName(moocletResponse.name),
    };

    try {
      return await this.moocletDataService.postNewVariable(variableRequest);
    } catch (err) {
      throw new Error(`Failed to create variable: ${err}`);
    }
  }

  private constructMoocletDetails(
    moocletResponse: MoocletResponseDetails,
    moocletVersionsResponse: MoocletVersionResponseDetails[],
    moocletPolicyParametersResponse: MoocletPolicyParametersResponseDetails
  ): MoocletDetails {
    return {
      mooclet: moocletResponse,
      versions: moocletVersionsResponse,
      policyParameters: moocletPolicyParametersResponse.parameters,
    };
  }

  public async getConditionFromMoocletProxy({
    moocletId,
    userId,
    experimentConditions,
  }: ExperimentCondtitionToMoocletVersionParams): Promise<ExperimentCondition> {
    const versionResponse = await this.moocletDataService.getVersionForNewLearner(moocletId, userId);
    const experimentCondition = this.findExperimentConditionFromVersionResponse(versionResponse, experimentConditions);

    return experimentCondition;
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

  private createOutcomeVariableName(moocletName: string): string {
    return 'TS_CONFIG_' + moocletName;
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

    try {
      return await this.moocletDataService.postNewVersion(newVersionRequest);
    } catch (err) {
      throw new Error(`Failed to create new version for Mooclet: ${err}`);
    }
  }
}
