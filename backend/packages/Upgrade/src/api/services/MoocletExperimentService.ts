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
import { MoocletExperimentRef } from '../models/MoocletExperimentRef';
import { MoocletVersionConditionMap } from '../models/MoocletVersionConditionMap';
import { v4 as uuid } from 'uuid';
import { MoocletExperimentRefRepository } from '../repositories/MoocletExperimentRefRepository';
import { ConditionValidator, ExperimentDTO } from '../DTO/ExperimentDTO';
import { UserDTO } from '../DTO/UserDTO';
import { Experiment } from '../models/Experiment';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import {
  ASSIGNMENT_ALGORITHM,
  EXPERIMENT_STATE,
  IMetricMetaData,
  MoocletPolicyParametersDTO,
  MoocletTSConfigurablePolicyParametersDTO,
  REPEATED_MEASURE,
  SUPPORTED_MOOCLET_ALGORITHMS,
} from 'upgrade_types';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { MetricService } from './MetricService';
import { Metric } from '../models/Metric';

export interface SyncCreateParams {
  experimentDTO: ExperimentDTO;
  currentUser: UserDTO;
  createType?: string;
  logger: UpgradeLogger;
}

export interface SyncEditParams {
  experimentDTO: ExperimentDTO;
  currentUser: UserDTO;
  logger: UpgradeLogger;
}

export interface SyncDeleteParams {
  moocletExperimentRef: MoocletExperimentRef;
  experimentId: string;
  currentUser: UserDTO;
  logger: UpgradeLogger;
}

export interface ExperimentDesignChanges {
  newOutcomeVariableName: string;
  addedConditions: ConditionValidator[];
  removedConditions: MoocletVersionConditionMap[];
  versionMapsToUpdate: MoocletVersionConditionMap[];
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
    queryService: QueryService,
    metricService: MetricService
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
      queryService,
      metricService
    );
  }

  public async syncCreate(params: SyncCreateParams): Promise<ExperimentDTO> {
    return this.dataSource.transaction((manager) => this.handleCreateMoocletTransaction(manager, params));
  }

  public async syncUpdate(params: SyncCreateParams): Promise<ExperimentDTO> {
    return this.dataSource.transaction((manager) => this.handleEditMoocletTransaction(manager, params));
  }

  public async syncDelete(params: SyncDeleteParams): Promise<Experiment> {
    return this.dataSource.transaction((manager) => this.handleDeleteMoocletTransaction(manager, params));
  }

  /**
   * handleCreateMoocletTransaction
   *
   * 1. Create and save an experiment-specific reward metric for the experiment
   * 2. Attach a percent-success reward metric query to the experimentDTO before saving
   * 3. Save the upgrade experiment
   * 4. Create and save the Mooclet experiment resources (outputs MoocletExperimentRef)
   * 5. Assign the rewardMetricKey to the MoocletExperimentRef
   * 6. Save the MoocletExperimentRef and VersionConditionMaps
   *
   * On any error, rollback the Mooclet resources and abort the transaction
   */

  private async handleCreateMoocletTransaction(
    manager: EntityManager,
    params: SyncCreateParams
  ): Promise<ExperimentDTO> {
    const logger = params.logger;
    const { moocletPolicyParameters, queries, rewardMetricKey, context } = params.experimentDTO;

    // create reward metric
    try {
      await this.createAndSaveRewardMetric(rewardMetricKey, context[0], logger);
    } catch (error) {
      logger.error({
        message: 'Failed to create reward metric',
        error,
        rewardMetricKey,
      });
      throw error;
    }

    this.attachRewardMetricQuery(rewardMetricKey, queries);

    // create Upgrade Experiment. If this fails, then mooclet resources will not be created, and the UpGrade experiment transaction will abort
    const experimentResponse = await this.createExperiment(manager, params);

    // create Mooclet resources. If this fails, it will internally rollback any mooclet resources created, and the UpGrade experiment transaction will abort
    const moocletExperimentRefResponse = await this.orchestrateMoocletCreation(
      experimentResponse,
      moocletPolicyParameters,
      logger
    );

    moocletExperimentRefResponse.rewardMetricKey = rewardMetricKey;

    logger.info({
      message: 'Mooclet experiment created successfully:',
      moocletExperimentRef: JSON.stringify(moocletExperimentRefResponse),
    });

    // additionally, create MoocletExperimentRef and VersionConditionMaps.
    // If either of THESE fail, we will need to rollback the mooclet resources here also before aborting the UpGrade experiment transaction
    try {
      await this.saveMoocletExperimentRef(manager, moocletExperimentRefResponse);
      await this.createAndSaveVersionConditionMaps(
        manager,
        moocletExperimentRefResponse.id,
        moocletExperimentRefResponse.versionConditionMaps,
        logger
      );

      experimentResponse.moocletPolicyParameters = moocletPolicyParameters;

      return experimentResponse;
    } catch (error) {
      await this.orchestrateDeleteMoocletResources(moocletExperimentRefResponse, logger);
      throw error;
    }
  }

  private async createExperiment(manager: EntityManager, params: SyncCreateParams): Promise<ExperimentDTO> {
    const { experimentDTO, currentUser, createType, logger } = params;
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
    moocletExperimentRefId: string,
    versionConditionMaps: MoocletVersionConditionMap[],
    logger: UpgradeLogger
  ): Promise<void> {
    for (const versionConditionMap of versionConditionMaps) {
      const versionConditionMapEntity = manager.create(MoocletVersionConditionMap, {
        ...versionConditionMap,
        moocletExperimentRefId,
        experimentConditionId: versionConditionMap.experimentConditionId,
      });
      const map = await manager.save(MoocletVersionConditionMap, versionConditionMapEntity);
      logger.info({
        message: 'MoocletVersionConditionMap created successfully:',
        versionConditionMap: JSON.stringify(map),
      });
    }
  }

  /**
   * handleEditMoocletTransaction
   *
   * 1. Detect changes in the experiment design that are not allowed for an active Mooclet experiment
   * 2. Update the upgrade experiment first so we can abort early if there are any issues
   * 3. Update the Mooclet resources based on the detected changes
   * 4. If there are new conditions, create the new versions and versionmaps
   * 5. If there are removed conditions, delete the Mooclet versions
   * 6. If there are condition code changes, update the Mooclet versions
   * 7. Return the updated experiment
   *
   */

  private async handleEditMoocletTransaction(manager: EntityManager, params: SyncEditParams): Promise<ExperimentDTO> {
    const { experimentDTO: incomingExperiment, currentUser, logger } = params;

    try {
      // 1. detect the changes we might care about
      const currentMoocletExperimentRef = await this.getMoocletExperimentRefByUpgradeExperimentId(
        incomingExperiment.id
      );
      const inactiveStateAllowedDesignChanges = await this.detectExperimentDesignChanges(
        incomingExperiment,
        currentMoocletExperimentRef,
        logger
      );

      if (incomingExperiment.state !== EXPERIMENT_STATE.INACTIVE && inactiveStateAllowedDesignChanges) {
        const error = {
          message: 'Ineligible changes detected for an active Mooclet experiment',
          changes: inactiveStateAllowedDesignChanges,
        };
        logger.error(error);
        throw new Error(JSON.stringify(error));
      }

      logger.debug({
        message: 'Mooclet experiment changes detected',
        changes: inactiveStateAllowedDesignChanges,
      });

      // 2. if the changes are allowed, go ahead and update the upgrade experiment first so we can abort early if there are any issues
      const updatedExperiment = await super.update(incomingExperiment, currentUser, logger, manager);

      //------ update each individual change to sync up Mooclet resources
      const { newOutcomeVariableName, addedConditions, removedConditions, versionMapsToUpdate } =
        inactiveStateAllowedDesignChanges;

      // 3. tell Mooclet about a new outcomeVariableName
      if (newOutcomeVariableName) {
        await this.handleUpdatedOutcomeVariableName(newOutcomeVariableName, currentMoocletExperimentRef, logger);
      }

      // 4. tell mooclet about policy parameter updates (even when actively enrolling)
      // TODO check how this will update with currentPosteriors attached to the policy parameters, does it ignore?
      const policyParametersResponse = await this.handleUpdatedPolicyParameters(
        incomingExperiment.moocletPolicyParameters,
        currentMoocletExperimentRef,
        logger
      );

      updatedExperiment.moocletPolicyParameters = policyParametersResponse.parameters;

      // 5. tell Mooclet about removed conditions
      if (removedConditions) {
        await this.handleRemovedConditions(removedConditions, logger);
      }

      // 6. tell Mooclet about condition code changes
      if (versionMapsToUpdate) {
        const updatedVersionConditionMaps = await this.handleConditionCodesChanged(
          versionMapsToUpdate,
          incomingExperiment,
          logger
        );

        await this.createAndSaveVersionConditionMaps(
          manager,
          currentMoocletExperimentRef.id,
          updatedVersionConditionMaps,
          logger
        );
      }

      // 7. if we have new conditions, we will need to manually create the new versions and versionmaps
      if (addedConditions) {
        this.handleAddedConditions(addedConditions, currentMoocletExperimentRef, logger);
      }

      return updatedExperiment;
    } catch (error) {
      console.error('Error updating experiment', error);
      throw error;
    }
  }

  private async detectNewOutcomeVariableName(
    incomingExperimentDTO: ExperimentDTO,
    currentMoocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
  ): Promise<string> {
    const newName = incomingExperimentDTO.moocletPolicyParameters['outcome_variable_name'];
    const currentVariable = await this.moocletDataService.getVariable(currentMoocletExperimentRef.variableId, logger);
    const currentName = currentVariable?.name;

    return newName !== currentName ? newName : null;
  }

  private detectNewConditions(
    incomingExperimentDTO: ExperimentDTO,
    currentMoocletExperimentRef: MoocletExperimentRef
  ): ConditionValidator[] {
    const newConditions = incomingExperimentDTO.conditions.filter(
      (condition) =>
        !currentMoocletExperimentRef.versionConditionMaps.find((map) => map.experimentCondition.id === condition.id)
    );

    return newConditions.length ? newConditions : null;
  }

  private detectRemovedConditions(
    incomingExperimentDTO: ExperimentDTO,
    currentMoocletExperimentRef: MoocletExperimentRef
  ): MoocletVersionConditionMap[] {
    const mapsForRemovedConditions = currentMoocletExperimentRef.versionConditionMaps.filter(
      (map) => !incomingExperimentDTO.conditions.find((condition) => condition.id === map.experimentCondition.id)
    );

    return mapsForRemovedConditions.length ? mapsForRemovedConditions : null;
  }

  private getVersionMapsWithConditionCodeChanges(
    incomingExperimentDTO: ExperimentDTO,
    currentMoocletExperimentRef: MoocletExperimentRef
  ): MoocletVersionConditionMap[] {
    const versionsToUpdate = currentMoocletExperimentRef.versionConditionMaps.filter((map) => {
      const condition = incomingExperimentDTO.conditions.find(
        (condition) => condition.id === map.experimentCondition.id
      );

      if (!condition) {
        return false;
      }

      return condition || condition.conditionCode !== map.experimentCondition.conditionCode;
    });

    return versionsToUpdate.length ? versionsToUpdate : null;
  }

  private async detectExperimentDesignChanges(
    incomingExperimentDTO: ExperimentDTO,
    currentMoocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
  ): Promise<ExperimentDesignChanges> {
    const changes = {
      newOutcomeVariableName: await this.detectNewOutcomeVariableName(
        incomingExperimentDTO,
        currentMoocletExperimentRef,
        logger
      ),
      addedConditions: this.detectNewConditions(incomingExperimentDTO, currentMoocletExperimentRef),
      removedConditions: this.detectRemovedConditions(incomingExperimentDTO, currentMoocletExperimentRef),
      versionMapsToUpdate: this.getVersionMapsWithConditionCodeChanges(
        incomingExperimentDTO,
        currentMoocletExperimentRef
      ),
    };

    const hasChanges = Object.values(changes).some((change) => !!change);

    return hasChanges ? changes : null;
  }

  private async handleUpdatedOutcomeVariableName(
    newOutcomeVariableName: string,
    currentMoocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
  ) {
    logger.debug({
      message: 'Updating outcome variable name due to experiment design change',
      newOutcomeVariableName,
      currentMoocletExperimentRef,
    });
    await this.moocletDataService.updateVariable(
      currentMoocletExperimentRef.variableId,
      {
        name: newOutcomeVariableName,
      },
      logger
    );
  }

  private async handleUpdatedPolicyParameters(
    newPolicyParameters: MoocletPolicyParametersDTO,
    currentMoocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
  ): Promise<MoocletPolicyParametersResponseDetails> {
    logger.debug({
      message: 'Updating policy parameters due to experiment design change',
      newPolicyParameters,
      currentMoocletExperimentRef,
    });
    return await this.moocletDataService.updatePolicyParameters(
      currentMoocletExperimentRef.policyParametersId,
      {
        mooclet: currentMoocletExperimentRef.moocletId,
        policy: currentMoocletExperimentRef.policyId,
        parameters: newPolicyParameters,
      },
      logger
    );
  }

  private async handleRemovedConditions(
    removedConditions: MoocletVersionConditionMap[],
    logger: UpgradeLogger
  ): Promise<void[]> {
    logger.debug({
      message: 'Removing conditions from Mooclet due to experiment design change',
      removedConditions,
    });
    return Promise.all(
      removedConditions.map(async (map) => {
        return await this.moocletDataService.deleteVersion(map.moocletVersionId, logger);
      })
    );
  }

  private async handleConditionCodesChanged(
    versionMapsToUpdate: MoocletVersionConditionMap[],
    incomingExperiment: ExperimentDTO,
    logger: UpgradeLogger
  ): Promise<MoocletVersionConditionMap[]> {
    return Promise.all(
      versionMapsToUpdate.map(async (versionMap) => {
        const version = await this.moocletDataService.getVersion(versionMap.moocletVersionId, logger);
        const condition = incomingExperiment.conditions.find(
          (changedCondition) => changedCondition.id === versionMap.experimentConditionId
        );

        if (version && condition && version.name !== condition.conditionCode) {
          version.name = condition.conditionCode;
          version.text = condition.conditionCode; // this could be mapped to payload
          await this.moocletDataService.updateVersion(versionMap.moocletVersionId, version, logger);
        }

        return versionMap;
      })
    );
  }

  private async handleAddedConditions(
    addedConditions: ConditionValidator[],
    currentMoocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
  ): Promise<MoocletVersionConditionMap[]> {
    logger.debug({
      message: 'Adding conditions to Mooclet due to experiment design change',
      addedConditions,
    });
    const newVersions: MoocletVersionResponseDetails[] = [];

    await Promise.all(
      addedConditions.map(async (condition) => {
        const newVersionRequest: MoocletVersionRequestBody = {
          mooclet: currentMoocletExperimentRef.moocletId,
          name: condition.conditionCode,
          text: condition.conditionCode,
        };

        const version = await this.moocletDataService.postNewVersion(newVersionRequest, logger);
        newVersions.push(version);
      })
    );

    return this.createMoocletVersionConditionMaps(newVersions, addedConditions);
  }

  private async handleDeleteMoocletTransaction(manager: EntityManager, params: SyncDeleteParams): Promise<Experiment> {
    const { moocletExperimentRef, currentUser, logger } = params;
    let deleteResponse: Experiment | undefined;

    try {
      // delete the upgrade experiment. If this fails, the Mooclet resources will not be deleted, and the transaction will abort
      deleteResponse = await super.delete(params.experimentId, currentUser, {
        existingEntityManager: manager,
      });

      if (moocletExperimentRef.rewardMetricKey) {
        await manager.getRepository(Metric).delete(moocletExperimentRef.rewardMetricKey);
      }

      // delete the mooclet resources. If this fails, the transaction will abort and the upgrade experiment will not be deleted,
      // but the Mooclet resources may not be deleted either
      await this.orchestrateDeleteMoocletResources(moocletExperimentRef, logger);

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
      throw error;
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
    moocletPolicyParameters: MoocletPolicyParametersDTO,
    logger: UpgradeLogger
  ): Promise<MoocletExperimentRef | undefined> {
    const newMoocletRequest: MoocletRequestBody = {
      name: upgradeExperiment.name + '-' + upgradeExperiment.id.slice(0, 8), //using part of exp uuid so this will make sure mooclet name is unique
      policy: null,
    };
    const moocletExperimentRef = new MoocletExperimentRef();
    moocletExperimentRef.experimentId = upgradeExperiment.id;

    logger.debug({
      message: '[Mooclet Creation] 0. Starting Mooclet creation process',
      upgradeExperiment: JSON.stringify(upgradeExperiment),
    });

    try {
      newMoocletRequest.policy = await this.getMoocletPolicy(upgradeExperiment.assignmentAlgorithm, logger);
      logger.debug({
        message: `[Mooclet Creation] 1. Policy id fetched:`,
        newMoocletRequest: JSON.stringify(newMoocletRequest),
      });

      const moocletResponse = await this.createMooclet(newMoocletRequest, logger);
      moocletExperimentRef.moocletId = moocletResponse.id;

      logger.debug({
        message: `[Mooclet Creation] 2. Mooclet created:`,
        moocletResponse: JSON.stringify(moocletResponse),
      });

      const moocletVersionsResponse = await this.createMoocletVersions(upgradeExperiment, moocletResponse, logger);
      moocletExperimentRef.versionConditionMaps = this.createMoocletVersionConditionMaps(
        moocletVersionsResponse,
        upgradeExperiment.conditions
      );
      logger.debug({
        message: `[Mooclet Creation] 3. Mooclet versions created:`,
        moocletVersionsResponse: JSON.stringify(moocletVersionsResponse),
      });

      const moocletPolicyParametersResponse = await this.createPolicyParameters(
        moocletResponse,
        moocletPolicyParameters,
        logger
      );
      moocletExperimentRef.policyParametersId = moocletPolicyParametersResponse.id;
      logger.debug({
        message: `[Mooclet Creation] 4. Policy parameters created:`,
        moocletPolicyParametersResponse: JSON.stringify(moocletPolicyParametersResponse),
      });

      const moocletVariableResponse = await this.createVariableIfNeeded(
        moocletPolicyParameters,
        upgradeExperiment.assignmentAlgorithm,
        logger
      );
      logger.debug({
        message: `[Mooclet Creation] 5. Variable created (if needed):`,
        moocletVariableResponse: JSON.stringify(moocletVariableResponse),
      });

      moocletExperimentRef.variableId = moocletVariableResponse?.id;
      moocletExperimentRef.policyId = newMoocletRequest.policy;
    } catch (err) {
      await this.orchestrateDeleteMoocletResources(moocletExperimentRef, logger);
      throw err;
    }

    moocletExperimentRef.id = uuid();

    return moocletExperimentRef;
  }

  private attachRewardMetricQuery(rewardMetricKey: string, queries: any[]) {
    queries.push({
      id: uuid(),
      name: 'Success Rate',
      query: {
        operationType: 'percentage',
        compareFn: '=',
        compareValue: 'SUCCESS',
      },
      metric: {
        key: rewardMetricKey,
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
    });
  }

  public async createAndSaveRewardMetric(
    rewardMetricKey: string,
    context: string,
    logger: UpgradeLogger
  ): Promise<Metric[]> {
    const metric = {
      id: uuid(),
      metric: rewardMetricKey,
      datatype: IMetricMetaData.CATEGORICAL,
      allowedValues: ['SUCCESS', 'FAILURE'],
    };

    return this.metricService.saveAllMetrics([metric], [context], logger);
  }

  private createMoocletVersionConditionMaps(
    versions: MoocletVersionResponseDetails[],
    conditions: ConditionValidator[]
  ): MoocletVersionConditionMap[] {
    const versionConditionMaps: MoocletVersionConditionMap[] = conditions.map((condition) => {
      const versionConditionMap = new MoocletVersionConditionMap();
      versionConditionMap.moocletVersionId = versions.find((version) => version.name === condition.conditionCode)?.id;
      versionConditionMap.experimentConditionId = condition.id;

      return versionConditionMap;
    });
    return versionConditionMaps;
  }

  public async orchestrateDeleteMoocletResources(
    moocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
  ): Promise<void> {
    try {
      if (!moocletExperimentRef) {
        throw new Error(`MoocletExperimentRef not defined`);
      }

      logger.debug({ message: '[Mooclet Deletion]: Starting deletion of Mooclet resources', moocletExperimentRef });

      // Delete Mooclet resources if they exist
      logger.debug({ message: '[Mooclet Deletion]: Deleting Mooclet', moocletId: moocletExperimentRef.moocletId });
      if (moocletExperimentRef.moocletId) {
        await this.moocletDataService.deleteMooclet(moocletExperimentRef.moocletId, logger);
        logger.debug({ message: '[Mooclet Deletion]: Deleted Mooclet', moocletId: moocletExperimentRef.moocletId });
      }

      await this.deleteMoocletVersions(moocletExperimentRef, logger);

      logger.debug({
        message: '[Mooclet Deletion]: Deleting policy parameters',
        policyParametersId: moocletExperimentRef.policyParametersId,
      });
      if (moocletExperimentRef.policyParametersId) {
        await this.moocletDataService.deletePolicyParameters(moocletExperimentRef.policyParametersId, logger);
        logger.debug({
          message: '[Mooclet Deletion]: Deleted policy parameters',
          policyParametersId: moocletExperimentRef.policyParametersId,
        });
      }

      logger.debug({ message: '[Mooclet Deletion]: Deleting variable', variableId: moocletExperimentRef.variableId });
      if (moocletExperimentRef.variableId) {
        await this.moocletDataService.deleteVariable(moocletExperimentRef.variableId, logger);
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

  private async deleteMoocletVersions(
    moocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
  ): Promise<void> {
    if (moocletExperimentRef.versionConditionMaps) {
      for (const versionConditionMap of moocletExperimentRef.versionConditionMaps) {
        logger.debug({
          message: '[Mooclet Deletion]: Deleting Mooclet version',
          moocletVersionId: versionConditionMap.moocletVersionId,
        });
        if (versionConditionMap.moocletVersionId) {
          await this.moocletDataService.deleteVersion(versionConditionMap.moocletVersionId, logger);
          logger.debug({
            message: '[Mooclet Deletion]: Deleted Mooclet version',
            moocletVersionId: versionConditionMap.moocletVersionId,
          });
        }
      }
    }
  }

  private async getMoocletPolicy(assignmentAlgorithm: string, logger: UpgradeLogger): Promise<number> {
    try {
      return await this.moocletDataService.getMoocletIdByName(assignmentAlgorithm, logger);
    } catch (err) {
      throw new Error(`Failed to get Mooclet policy: ${err}`);
    }
  }

  public async attachRewardKeyAndPolicyParamsToExperimentDTO(
    experiment: ExperimentDTO,
    logger: UpgradeLogger
  ): Promise<ExperimentDTO> {
    try {
      const moocletExperimentRef = await this.getMoocletExperimentRefByUpgradeExperimentId(experiment.id);
      const policyParamters = await this.moocletDataService.getPolicyParameters(
        moocletExperimentRef.policyParametersId,
        logger
      );
      experiment.rewardMetricKey = moocletExperimentRef.rewardMetricKey;
      experiment.moocletPolicyParameters = policyParamters.parameters;

      return experiment;
    } catch (err) {
      throw new Error(`Failed to get Mooclet policy parameters: ${err}`);
    }
  }

  private async createMooclet(
    newMoocletRequest: MoocletRequestBody,
    logger: UpgradeLogger
  ): Promise<MoocletResponseDetails> {
    try {
      return await this.moocletDataService.postNewMooclet(newMoocletRequest, logger);
    } catch (err) {
      throw new Error(`Failed to create Mooclet: ${err}`);
    }
  }

  private async createMoocletVersions(
    experiment: ExperimentDTO,
    moocletResponse: MoocletResponseDetails,
    logger: UpgradeLogger
  ): Promise<MoocletVersionResponseDetails[]> {
    if (!moocletResponse?.id || !experiment.conditions) return null;

    try {
      return await Promise.all(
        experiment.conditions.map(async (condition, index) =>
          this.createNewVersion(condition, moocletResponse, index, logger)
        )
      );
    } catch (err) {
      throw new Error(`Failed to create Mooclet versions: ${err}`);
    }
  }

  private async createNewVersion(
    upgradeCondition: ConditionValidator,
    mooclet: MoocletResponseDetails,
    index: number,
    logger: UpgradeLogger
  ): Promise<MoocletVersionResponseDetails> {
    const newVersionRequest: MoocletVersionRequestBody = {
      mooclet: mooclet.id,
      name: upgradeCondition.conditionCode,
      text: upgradeCondition.conditionCode,
    };

    try {
      return await this.moocletDataService.postNewVersion(newVersionRequest, logger);
    } catch (err) {
      throw new Error(`Failed to create new version for Mooclet: ${err}`);
    }
  }

  private async createPolicyParameters(
    moocletResponse: MoocletResponseDetails,
    moocletPolicyParameters: MoocletPolicyParametersDTO,
    logger: UpgradeLogger
  ): Promise<MoocletPolicyParametersResponseDetails> {
    if (!moocletResponse) return null;

    const policyParametersRequest: MoocletPolicyParametersRequestBody = {
      mooclet: moocletResponse.id,
      policy: moocletResponse.policy,
      parameters: moocletPolicyParameters,
    };

    try {
      return await this.moocletDataService.postNewPolicyParameters(policyParametersRequest, logger);
    } catch (err) {
      throw new Error(`Failed to create Mooclet policy parameters: ${err}`);
    }
  }

  private async createVariableIfNeeded(
    moocletPolicyParametersResponse: MoocletPolicyParametersDTO,
    assignmentAlgorithm: string,
    logger: UpgradeLogger
  ): Promise<MoocletVariableResponseDetails> {
    if (!moocletPolicyParametersResponse || assignmentAlgorithm !== ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE) {
      return null;
    }

    const variableRequest: MoocletVariableRequestBody = {
      name: (moocletPolicyParametersResponse as MoocletTSConfigurablePolicyParametersDTO)?.outcome_variable_name,
    };

    try {
      return await this.moocletDataService.postNewVariable(variableRequest, logger);
    } catch (err) {
      logger.error({ message: 'Failed to create Mooclet variable' });
      throw new Error(`Failed to create variable: ${err}`);
    }
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

  public async getConditionFromMoocletProxy(
    experiment: Experiment,
    userId: string,
    logger: UpgradeLogger
  ): Promise<ExperimentCondition> {
    const moocletExperimentRef = await this.getMoocletExperimentRefByUpgradeExperimentId(experiment.id);
    const versionResponse = await this.moocletDataService.getVersionForNewLearner(
      moocletExperimentRef.moocletId,
      userId,
      logger
    );
    const experimentCondition = this.mapMoocletVersionToUpgradeCondition(versionResponse, moocletExperimentRef, logger);
    return experimentCondition;
  }

  private mapMoocletVersionToUpgradeCondition(
    versionResponse: MoocletVersionResponseDetails,
    moocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
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
      logger.error(error);
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
      logger.error(error);
      throw new Error(JSON.stringify(error));
    }

    return experimentCondition;
  }

  public isMoocletExperiment(assignmentAlgorithm: ASSIGNMENT_ALGORITHM): boolean {
    return SUPPORTED_MOOCLET_ALGORITHMS.includes(assignmentAlgorithm);
  }
}
