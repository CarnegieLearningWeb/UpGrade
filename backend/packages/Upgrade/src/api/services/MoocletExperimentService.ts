import { Service } from 'typedi';
import { MoocletDataService } from './MoocletDataService';
import {
  MoocletPolicyParametersRequestBody,
  MoocletPolicyParametersResponseDetails,
  MoocletRequestBody,
  MoocletResponseDetails,
  MoocletVariableRequestBody,
  MoocletVariableResponseDetails,
  MoocletVersionRequestBody,
  MoocletVersionResponseDetails,
} from '../../types/Mooclet';
import { ExperimentService } from './ExperimentService';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { ExperimentConditionRepository } from '../repositories/ExperimentConditionRepository';
import { InjectRepository, InjectDataSource } from '../../typeorm-typedi-extensions';
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
import { UnprocessableEntityException } from '@nestjs/common';
import { MoocletExperimentRef } from '../models/MoocletExperimentRef';
import { MoocletVersionConditionMap } from '../models/MoocletVersionConditionMap';
import { v4 as uuid } from 'uuid';
import { MoocletExperimentRefRepository } from '../repositories/MoocletExperimentRefRepository';
import { ConditionValidator, ExperimentDTO } from '../DTO/ExperimentDTO';
import { UserDTO } from '../DTO/UserDTO';
import { Experiment } from '../models/Experiment';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { ASSIGNMENT_ALGORITHM, MOOCLET_POLICY_SCHEMA_MAP, MoocletPolicyParametersDTO } from 'upgrade_types';
import { ExperimentCondition } from '../models/ExperimentCondition';

export interface SyncCreateParams {
  experimentDTO: ExperimentDTO;
  currentUser: UserDTO;
  createType?: string;
}

export interface SyncDeleteParams {
  moocletExperimentRef: MoocletExperimentRef;
  experimentId: string;
  currentUser: UserDTO;
  logger: UpgradeLogger;
}

const logger = new UpgradeLogger('MoocletExperimentService');

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

  public async syncCreate(params: SyncCreateParams): Promise<ExperimentDTO> {
    return this.dataSource.transaction((manager) => this.handleCreateMoocletTransaction(manager, params));
  }

  public async syncDelete(params: SyncDeleteParams): Promise<Experiment> {
    return this.dataSource.transaction((manager) => this.handleDeleteMoocletTransaction(manager, params));
  }

  public async syncAddBulkExperiments(
    experiments: ExperimentDTO[],
    currentUser: UserDTO,
    logger: UpgradeLogger
  ): Promise<ExperimentDTO[]> {
    const upgradeExperiments: ExperimentDTO[] = [];
    const moocletExperiments: ExperimentDTO[] = [];
    await Promise.all(
      experiments.map(async (experiment) => {
        if (this.isMoocletExperiment(experiment.assignmentAlgorithm)) {
          try {
            await this.syncCreate({
              experimentDTO: experiment,
              currentUser,
            });
          } catch (error) {
            logger.error({
              message: 'Failed to create Mooclet experiment during import',
              error: error,
              experiment: experiment,
              user: currentUser,
            });
            throw error;
          }
          moocletExperiments.push(experiment);
        } else {
          upgradeExperiments.push(experiment);
        }
      })
    );

    return [...(await super.addBulkExperiments(upgradeExperiments, currentUser, logger)), ...moocletExperiments];
  }

  private async handleCreateMoocletTransaction(
    manager: EntityManager,
    params: SyncCreateParams
  ): Promise<ExperimentDTO> {
    const moocletPolicyParameters = params.experimentDTO.moocletPolicyParameters;

    // create Upgrade Experiment. If this fails, then mooclet resources will not be created, and the UpGrade experiment transaction will abort
    const experimentResponse = await this.createExperiment(manager, params);

    // create Mooclet resources. If this fails, it will internally rollback any mooclet resources created, and the UpGrade experiment transaction will abort
    const moocletExperimentRefResponse = await this.orchestrateMoocletCreation(
      experimentResponse,
      moocletPolicyParameters
    );

    logger.info({
      message: 'Mooclet experiment created successfully:',
      moocletExperimentRef: JSON.stringify(moocletExperimentRefResponse),
    });

    // additionally, create MoocletExperimentRef and VersionConditionMaps.
    // If either of THESE fail, we will need to rollback the mooclet resources here also before aborting the UpGrade experiment transaction
    try {
      await this.saveMoocletExperimentRef(manager, moocletExperimentRefResponse);
      await this.createAndSaveVersionConditionMaps(manager, moocletExperimentRefResponse);

      experimentResponse.moocletPolicyParameters = moocletPolicyParameters;

      return experimentResponse;
    } catch (error) {
      await this.orchestrateDeleteMoocletResources(moocletExperimentRefResponse);
      throw error;
    }
  }

  private async createExperiment(manager: EntityManager, params: SyncCreateParams): Promise<ExperimentDTO> {
    const { experimentDTO, currentUser, createType } = params;
    return await super.create(experimentDTO, currentUser, logger, {
      existingEntityManager: manager,
      createType,
    });
  }

  private async saveMoocletExperimentRef(
    manager: EntityManager,
    moocletExperimentRefResponse: MoocletExperimentRef
  ): Promise<void> {
    await manager.save(MoocletExperimentRef, moocletExperimentRefResponse);
  }

  private async createAndSaveVersionConditionMaps(
    manager: EntityManager,
    moocletExperimentRefResponse: MoocletExperimentRef
  ): Promise<void> {
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
  }

  private async handleDeleteMoocletTransaction(manager: EntityManager, params: SyncDeleteParams): Promise<Experiment> {
    const { moocletExperimentRef, currentUser, logger } = params;
    let deleteResponse: Experiment | undefined;

    try {
      // delete the upgrade experiment. If this fails, the Mooclet resources will not be deleted, and the transaction will abort
      deleteResponse = await super.delete(params.experimentId, currentUser, {
        existingEntityManager: manager,
      });
      // delete the mooclet resources. If this fails, the transaction will abort and the upgrade experiment will not be deleted,
      // but the Mooclet resources may not be deleted either
      await this.orchestrateDeleteMoocletResources(moocletExperimentRef);

      logger.debug({
        message: 'Upgrade and Mooclet experiment resources deleted successfully',
        deleteResponse,
      });

      return deleteResponse;
    } catch (error) {
      logger.error({
        message: 'Failed to delete experiment with Mooclet',
        error: error,
        experimentId: params.experimentId,
        user: currentUser,
      });
      throw new UnprocessableEntityException('Failed to delete experiment with Mooclet');
    }
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
    upgradeExperiment: ExperimentDTO,
    moocletPolicyParameters: MoocletPolicyParametersDTO
  ): Promise<MoocletExperimentRef | undefined> {
    const newMoocletRequest: MoocletRequestBody = {
      name: upgradeExperiment.name,
      policy: null,
    };
    const moocletExperimentRef = new MoocletExperimentRef();
    moocletExperimentRef.experimentId = upgradeExperiment.id;

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
      moocletExperimentRef.moocletId = moocletResponse.id;

      logger.debug({
        message: `[Mooclet Creation] 2. Mooclet created:`,
        moocletResponse: JSON.stringify(moocletResponse),
      });

      const moocletVersionsResponse = await this.createMoocletVersions(upgradeExperiment, moocletResponse);
      moocletExperimentRef.versionConditionMaps = this.createMoocletVersionConditionMaps(
        moocletVersionsResponse,
        upgradeExperiment
      );
      logger.debug({
        message: `[Mooclet Creation] 3. Mooclet versions created:`,
        moocletVersionsResponse: JSON.stringify(moocletVersionsResponse),
      });

      const moocletPolicyParametersResponse = await this.createPolicyParameters(
        moocletResponse,
        moocletPolicyParameters
      );
      moocletExperimentRef.policyParametersId = moocletPolicyParametersResponse.id;
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

      moocletExperimentRef.variableId = moocletVariableResponse?.id;
    } catch (err) {
      await this.orchestrateDeleteMoocletResources(moocletExperimentRef);
      throw err;
    }

    moocletExperimentRef.id = uuid();

    return moocletExperimentRef;
  }

  private createMoocletVersionConditionMaps(
    moocletVersionsResponse: MoocletVersionResponseDetails[],
    upgradeExperiment: ExperimentDTO
  ): MoocletVersionConditionMap[] {
    const versionConditionMaps: MoocletVersionConditionMap[] = upgradeExperiment.conditions.map((condition) => {
      const versionConditionMap = new MoocletVersionConditionMap();
      versionConditionMap.moocletVersionId = moocletVersionsResponse.find(
        (version) => version.name === condition.conditionCode
      )?.id;
      versionConditionMap.experimentConditionId = condition.id;

      return versionConditionMap;
    });
    return versionConditionMaps;
  }

  public async orchestrateDeleteMoocletResources(moocletExperimentRef: MoocletExperimentRef): Promise<void> {
    const logger = new UpgradeLogger('MoocletExperimentService');
    try {
      if (!moocletExperimentRef) {
        throw new Error(`MoocletExperimentRef not defined`);
      }

      logger.debug({ message: '[Mooclet Deletion]: Starting deletion of Mooclet resources', moocletExperimentRef });

      // Delete Mooclet resources if they exist
      logger.debug({ message: '[Mooclet Deletion]: Deleting Mooclet', moocletId: moocletExperimentRef.moocletId });
      if (moocletExperimentRef.moocletId) {
        await this.moocletDataService.deleteMooclet(moocletExperimentRef.moocletId);
        logger.debug({ message: '[Mooclet Deletion]: Deleted Mooclet', moocletId: moocletExperimentRef.moocletId });
      }

      await this.deleteMoocletVersions(moocletExperimentRef);

      logger.debug({
        message: '[Mooclet Deletion]: Deleting policy parameters',
        policyParametersId: moocletExperimentRef.policyParametersId,
      });
      if (moocletExperimentRef.policyParametersId) {
        await this.moocletDataService.deletePolicyParameters(moocletExperimentRef.policyParametersId);
        logger.debug({
          message: '[Mooclet Deletion]: Deleted policy parameters',
          policyParametersId: moocletExperimentRef.policyParametersId,
        });
      }

      logger.debug({ message: '[Mooclet Deletion]: Deleting variable', variableId: moocletExperimentRef.variableId });
      if (moocletExperimentRef.variableId) {
        await this.moocletDataService.deleteVariable(moocletExperimentRef.variableId);
        logger.debug({ message: '[Mooclet Deletion]: Deleted variable', variableId: moocletExperimentRef.variableId });
      }

      logger.info({ message: '[Mooclet Deletion]: Completed deletion of Mooclet resources', moocletExperimentRef });
    } catch (err) {
      logger.error({
        message:
          '[Mooclet Deletion]: Failed to delete Mooclet resources, please check manually for out of sync resources',
        error: err,
        moocletExperimentRef: moocletExperimentRef,
      });
      throw err;
    }
  }

  private async deleteMoocletVersions(moocletExperimentRef: MoocletExperimentRef): Promise<void> {
    if (moocletExperimentRef.versionConditionMaps) {
      for (const versionConditionMap of moocletExperimentRef.versionConditionMaps) {
        logger.debug({
          message: '[Mooclet Deletion]: Deleting Mooclet version',
          moocletVersionId: versionConditionMap.moocletVersionId,
        });
        if (versionConditionMap.moocletVersionId) {
          await this.moocletDataService.deleteVersion(versionConditionMap.moocletVersionId);
          logger.debug({
            message: '[Mooclet Deletion]: Deleted Mooclet version',
            moocletVersionId: versionConditionMap.moocletVersionId,
          });
        }
      }
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
    experiment: ExperimentDTO,
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

  private async createPolicyParameters(
    moocletResponse: MoocletResponseDetails,
    moocletPolicyParameters: MoocletPolicyParametersDTO
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
      throw new Error(`Failed to create Mooclet policy parameters: ${err}`);
    }
  }

  private async createVariableIfNeeded(
    moocletPolicyParametersResponse: MoocletPolicyParametersResponseDetails,
    assignmentAlgorithm: string,
    moocletResponse: MoocletResponseDetails
  ): Promise<MoocletVariableResponseDetails> {
    if (!moocletPolicyParametersResponse || assignmentAlgorithm !== ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE) {
      return null;
    }

    const variableRequest: MoocletVariableRequestBody = {
      name: this.createOutcomeVariableName(moocletResponse.name),
    };

    try {
      return await this.moocletDataService.postNewVariable(variableRequest);
    } catch (err) {
      logger.error({ message: 'Failed to create Mooclet variable' });
      throw new Error(`Failed to create variable: ${err}`);
    }
  }

  private createOutcomeVariableName(moocletName: string): string {
    return 'TS_CONFIG_' + moocletName;
  }

  public async getMoocletExperimentRefByUpgradeExperimentId(
    upgradeExperimentId: string
  ): Promise<MoocletExperimentRef | undefined> {
    const moocletExperimentRef = await this.moocletExperimentRefRepository.findOne({
      where: { experimentId: upgradeExperimentId },
      relations: ['versionConditionMaps', 'versionConditionMaps.experimentCondition'],
    });
    return moocletExperimentRef;
  }

  public async getConditionFromMoocletProxy(experiment: Experiment, userId: string): Promise<ExperimentCondition> {
    const moocletExperimentRef = await this.getMoocletExperimentRefByUpgradeExperimentId(experiment.id);
    const versionResponse = await this.moocletDataService.getVersionForNewLearner(
      moocletExperimentRef.moocletId,
      userId
    );
    const experimentCondition = this.mapMoocletVersionToUpgradeCondition(versionResponse, moocletExperimentRef);
    return experimentCondition;
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

  public isMoocletExperiment(assignmentAlgorithm: ASSIGNMENT_ALGORITHM): boolean {
    return Object.keys(MOOCLET_POLICY_SCHEMA_MAP).includes(assignmentAlgorithm);
  }
}
