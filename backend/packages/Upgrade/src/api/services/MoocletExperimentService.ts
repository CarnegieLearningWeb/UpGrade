import { Service } from 'typedi';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { MoocletDataService } from './MoocletDataService';
import {
  ASSIGNMENT_ALGORITHM,
  ExperimentCondtitionToMoocletVersionParams,
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
import { ExperimentService } from './ExperimentService';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { ExperimentConditionRepository } from '../repositories/ExperimentConditionRepository';
import { InjectRepository, InjectDataSource } from 'src/typeorm-typedi-extensions';
import { DataSource, EntityManager } from 'typeorm';
import { ArchivedStatsRepository } from '../repositories/ArchivedStatsRepository';
import { ConditionPayloadRepository } from '../repositories/ConditionPayloadRepository';
import { DecisionPointRepository } from '../repositories/DecisionPointRepository';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { ExperimentSegmentExclusionRepository } from '../repositories/ExperimentSegmentExclusionRepository';
import { ExperimentSegmentInclusionRepository } from '../repositories/ExperimentSegmentInclusionRepository';
import { ExperimentUserRepository } from '../repositories/ExperimentUserRepository';
import { FactorRepository } from '../repositories/FactorRepository';
import { GroupExclusionRepository } from '../repositories/GroupExclusionRepository';
import { IndividualExclusionRepository } from '../repositories/IndividualExclusionRepository';
import { LevelCombinationElementRepository } from '../repositories/LevelCombinationElements';
import { LevelRepository } from '../repositories/LevelRepository';
import { MetricRepository } from '../repositories/MetricRepository';
import { MonitoredDecisionPointRepository } from '../repositories/MonitoredDecisionPointRepository';
import { QueryRepository } from '../repositories/QueryRepository';
import { StateTimeLogsRepository } from '../repositories/StateTimeLogsRepository';
import { StratificationFactorRepository } from '../repositories/StratificationFactorRepository';
import { CacheService } from './CacheService';
import { ErrorService } from './ErrorService';
import { PreviewUserService } from './PreviewUserService';
import { QueryService } from './QueryService';
import { ScheduledJobService } from './ScheduledJobService';
import { SegmentService } from './SegmentService';
import { User } from '../models/User';
import { UnprocessableEntityException } from '@nestjs/common';
import { MoocletExperimentRef } from '../models/MoocletExperimentRef';
import { MoocletVersionConditionMap } from '../models/MoocletVersionConditionMap';
import { v4 as uuid } from 'uuid';
import { MoocletExperimentDTO } from '../DTO/MoocletExperimentDTO';
import { MoocletPolicyParameters } from 'types/src';
import { MoocletExperimentRefRepository } from '../repositories/MoocletExperimentRefRepository';
import { ConditionValidator } from '../DTO/ExperimentDTO';

interface SyncCreateParams {
  experimentDTO: MoocletExperimentDTO;
  currentUser: User;
  logger: UpgradeLogger;
  createType?: string;
}

@Service()
export class MoocletExperimentService extends ExperimentService {
  constructor(
    private moocletDataService: MoocletDataService,
    @InjectRepository() experimentRepository: ExperimentRepository,
    @InjectRepository() experimentConditionRepository: ExperimentConditionRepository,
    @InjectRepository() decisionPointRepository: DecisionPointRepository,
    @InjectRepository() experimentAuditLogRepository: ExperimentAuditLogRepository,
    @InjectRepository() individualExclusionRepository: IndividualExclusionRepository,
    @InjectRepository() groupExclusionRepository: GroupExclusionRepository,
    @InjectRepository() monitoredDecisionPointRepository: MonitoredDecisionPointRepository,
    @InjectRepository() userRepository: ExperimentUserRepository,
    @InjectRepository() metricRepository: MetricRepository,
    @InjectRepository() queryRepository: QueryRepository,
    @InjectRepository() stateTimeLogsRepository: StateTimeLogsRepository,
    @InjectRepository() experimentSegmentInclusionRepository: ExperimentSegmentInclusionRepository,
    @InjectRepository() experimentSegmentExclusionRepository: ExperimentSegmentExclusionRepository,
    @InjectRepository() conditionPayloadRepository: ConditionPayloadRepository,
    @InjectRepository() factorRepository: FactorRepository,
    @InjectRepository() levelRepository: LevelRepository,
    @InjectRepository() levelCombinationElementsRepository: LevelCombinationElementRepository,
    @InjectRepository() archivedStatsRepository: ArchivedStatsRepository,
    @InjectRepository() stratificationRepository: StratificationFactorRepository,
    @InjectRepository()
    private readonly moocletExperimentRefRepository: MoocletExperimentRefRepository,
    @InjectDataSource() dataSource: DataSource,
    previewUserService: PreviewUserService,
    segmentService: SegmentService,
    scheduledJobService: ScheduledJobService,
    errorService: ErrorService,
    cacheService: CacheService,
    queryService: QueryService
  ) {
    super(
      experimentRepository,
      experimentConditionRepository,
      decisionPointRepository,
      experimentAuditLogRepository,
      individualExclusionRepository,
      groupExclusionRepository,
      monitoredDecisionPointRepository,
      userRepository,
      metricRepository,
      queryRepository,
      stateTimeLogsRepository,
      experimentSegmentInclusionRepository,
      experimentSegmentExclusionRepository,
      conditionPayloadRepository,
      factorRepository,
      levelRepository,
      levelCombinationElementsRepository,
      archivedStatsRepository,
      stratificationRepository,
      dataSource,
      previewUserService,
      segmentService,
      scheduledJobService,
      errorService,
      cacheService,
      queryService
    );
  }

  public async syncCreate(params: SyncCreateParams): Promise<MoocletExperimentDTO> {
    return this.dataSource.transaction((manager) => this.handleCreateMoocletTransaction(manager, params));
  }

  private async handleCreateMoocletTransaction(
    manager: EntityManager,
    params: SyncCreateParams
  ): Promise<MoocletExperimentDTO> {
    const { experimentDTO, currentUser, logger, createType } = params;
    const { moocletPolicyParameters, ...experiment } = experimentDTO;
    let moocletExperimentRefResponse: MoocletExperimentRef;
    let experimentResponse: MoocletExperimentDTO;

    try {
      experimentResponse = (await super.create(experiment, currentUser, logger, {
        existingEntityManager: manager,
        createType,
      })) as MoocletExperimentDTO;
      moocletExperimentRefResponse = await this.orchestrateMoocletCreation(
        experimentResponse,
        moocletPolicyParameters,
        logger
      );
      logger.info({
        message: 'Mooclet experiment created successfully:',
        moocletExperimentRef: JSON.stringify(moocletExperimentRefResponse),
      });

      await manager.save(MoocletExperimentRef, moocletExperimentRefResponse);

      // Create and save the related MoocletVersionConditionMap entities
      if (moocletExperimentRefResponse.versionConditionMaps) {
        for (const versionConditionMap of moocletExperimentRefResponse.versionConditionMaps) {
          const versionConditionMapEntity = manager.create(MoocletVersionConditionMap, {
            ...versionConditionMap,
            moocletExperimentRefId: moocletExperimentRefResponse.id,
            experimentConditionId: versionConditionMap.experimentConditionId,
          });
          const map = await manager.save(MoocletVersionConditionMap, versionConditionMapEntity);
          logger.info({
            message: 'MoocletVersionConditionMap created successfully:',
            versionConditionMap: JSON.stringify(map),
          });
        }
      }
    } catch (error) {
      logger.error({
        message: 'Failed to sync experiment with Mooclet',
        error: error,
        experiment: experimentDTO,
        user: currentUser,
      });
      throw new UnprocessableEntityException('Failed to sync experiment with Mooclet');
    }

    experimentResponse.moocletPolicyParameters = moocletPolicyParameters;

    return experimentResponse;
  }

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
    upgradeExperiment: MoocletExperimentDTO,
    moocletPolicyParameters: MoocletPolicyParameters,
    logger: UpgradeLogger
  ): Promise<MoocletExperimentRef> {
    const newMoocletRequest: MoocletRequestBody = {
      name: upgradeExperiment.name,
      policy: null,
    };

    logger.debug({
      message: '[Mooclet Creation] 0. Starting Mooclet creation process',
      upgradeExperiment: JSON.stringify(upgradeExperiment),
    });

    try {
      newMoocletRequest.policy = await this.getMoocletPolicy(upgradeExperiment.assignmentAlgorithm);
      logger.debug({
        message: `[Mooclet Creation] 1. Policy id fetched:`,
        newMoocletRequest: JSON.stringify(newMoocletRequest),
      });

      const moocletResponse = await this.createMooclet(newMoocletRequest);
      logger.debug({
        message: `[Mooclet Creation] 2. Mooclet created:`,
        moocletResponse: JSON.stringify(moocletResponse),
      });

      const moocletVersionsResponse = await this.createMoocletVersions(upgradeExperiment, moocletResponse);
      logger.debug({
        message: `[Mooclet Creation] 3. Mooclet versions created:`,
        moocletVersionsResponse: JSON.stringify(moocletVersionsResponse),
      });

      const moocletPolicyParametersResponse = await this.createPolicyParameters(
        moocletResponse,
        moocletPolicyParameters
      );
      logger.debug({
        message: `[Mooclet Creation] 4. Policy parameters created:`,
        moocletPolicyParametersResponse: JSON.stringify(moocletPolicyParametersResponse),
      });

      const moocletVariableResponse = await this.createVariableIfNeeded(
        moocletPolicyParametersResponse,
        upgradeExperiment.assignmentAlgorithm,
        moocletResponse
      );
      logger.debug({
        message: `[Mooclet Creation] 5. Variable created (if needed):`,
        moocletVariableResponse: JSON.stringify(moocletVariableResponse),
      });

      return this.constructMoocletExperimentRef(
        moocletResponse,
        moocletVersionsResponse,
        moocletPolicyParametersResponse,
        upgradeExperiment
      );
    } catch (err) {
      throw new Error(
        JSON.stringify({
          message: '[Mooclet Creation] Failed, see sequence of events in logs for more details.',
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
      throw new Error(`Failed to create Mooclet: ${err}`);
    }
  }

  private async createMoocletVersions(
    experiment: MoocletExperimentDTO,
    moocletResponse: MoocletResponseDetails
  ): Promise<MoocletVersionResponseDetails[]> {
    if (!moocletResponse?.id || !experiment.conditions) return null;

    try {
      return await Promise.all(
        experiment.conditions.map(async (condition, index) => this.createNewVersion(condition, moocletResponse, index))
      );
    } catch (err) {
      throw new Error(`Failed to create Mooclet versions: ${err}`);
    }
  }

  private async createPolicyParameters(
    moocletResponse: MoocletResponseDetails,
    moocletPolicyParameters: MoocletPolicyParameters
  ): Promise<MoocletPolicyParametersResponseDetails> {
    if (!moocletResponse) return null;

    const policyParametersRequest: MoocletPolicyParametersRequestBody = {
      mooclet: moocletResponse.id,
      policy: moocletResponse.policy,
      parameters: moocletPolicyParameters,
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

  private constructMoocletExperimentRef(
    moocletResponse: MoocletResponseDetails,
    moocletVersionsResponse: MoocletVersionResponseDetails[],
    moocletPolicyParametersResponse: MoocletPolicyParametersResponseDetails,
    upgradeExperiment: MoocletExperimentDTO
  ): MoocletExperimentRef {
    const versionConditionMaps: MoocletVersionConditionMap[] = upgradeExperiment.conditions.map((condition) => {
      return {
        moocletVersionId: moocletVersionsResponse.find((version) => version.name === condition.conditionCode)?.id,
        experimentConditionId: condition.id,
      };
    });

    return {
      id: uuid(),
      moocletId: moocletResponse.id,
      experimentId: upgradeExperiment.id,
      versionConditionMaps: versionConditionMaps,
      policyParametersId: moocletPolicyParametersResponse.id,
    };
  }

  public async getConditionFromMoocletProxy(moocletExperimentRef: MoocletExperimentRef, userId: string): Promise<ExperimentCondition> {
    const versionResponse = await this.moocletDataService.getVersionForNewLearner(moocletExperimentRef.moocletId, userId);
    const experimentCondition = this.mapMoocletVersionToUpgradeCondition(versionResponse, moocletExperimentRef);
    return experimentCondition;
  }

  public async getMoocletExperimentRefByUpgradeExperimentId(upgradeExperimentId: string): Promise<MoocletExperimentRef | undefined> {
    const moocletExperimentRef = await this.moocletExperimentRefRepository.findOne({
      where: { experimentId: upgradeExperimentId },
      relations: ['versionConditionMaps'],
    });
    return moocletExperimentRef;
  }


  private mapMoocletVersionToUpgradeCondition(
    versionResponse: MoocletVersionResponseDetails,
    moocletExperimentRef: MoocletExperimentRef
  ): ExperimentCondition {
    // Find the corresponding versionConditionMap
    const versionConditionMap = moocletExperimentRef.versionConditionMaps.find(
      (map) => map.moocletVersionId === versionResponse.id
    );
  
    if (!versionConditionMap) {
      const error = {
        message: 'Version ID not found in version condition maps',
        version: versionResponse,
        versionConditionMaps: moocletExperimentRef.versionConditionMaps,
      };
      throw new Error(JSON.stringify(error));
    }
  
    // Get the experiment condition from the versionConditionMap
    const experimentCondition = versionConditionMap.experimentCondition;
  
    if (!experimentCondition) {
      const error = {
        message: 'Experiment condition not found in version condition map',
        version: versionResponse,
        versionConditionMap,
      };
      throw new Error(JSON.stringify(error));
    }
  
    return experimentCondition;
  }

  private createOutcomeVariableName(moocletName: string): string {
    return 'TS_CONFIG_' + moocletName;
  }

  private async createNewVersion(
    upgradeCondition: ConditionValidator,
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
