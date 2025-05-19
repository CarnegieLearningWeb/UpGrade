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
  MoocletPolicyParametersDTO,
  MoocletTSConfigurablePolicyParametersDTO,
  SUPPORTED_MOOCLET_ALGORITHMS,
} from 'upgrade_types';
import { ExperimentCondition } from '../models/ExperimentCondition';
import { MetricService } from './MetricService';
import { Metric } from '../models/Metric';
import { MoocletRewardsService } from './MoocletRewardsService';
import { env } from '../../env';

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

export interface AllowedInactiveStateChanges {
  newOutcomeVariableName: string | false;
  addedConditions: ConditionValidator[] | false;
  removedConditions: MoocletVersionConditionMap[] | false;
  modifiedConditions: MoocletVersionConditionMap[] | false;
}

export interface EditRollbackRef {
  revertPolicyParameters: MoocletPolicyParametersDTO;
  revertOutcomeVariableName: string;
  restoreVersions: ExperimentCondition[];
  revertVersionModifications: MoocletVersionConditionMap[];
  removeVersions: MoocletVersionConditionMap[];
  currentMoocletExperimentRef: MoocletExperimentRef;
  currentExperiment: Experiment;
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
    moocletExperimentRefRepository: MoocletExperimentRefRepository,
    @InjectDataSource() dataSource: DataSource,
    previewUserService: PreviewUserService,
    segmentService: SegmentService,
    scheduledJobService: ScheduledJobService,
    errorService: ErrorService,
    cacheService: CacheService,
    queryService: QueryService,
    metricService: MetricService,
    moocletRewardsService: MoocletRewardsService
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
      moocletExperimentRefRepository,
      dataSource,
      previewUserService,
      segmentService,
      scheduledJobService,
      errorService,
      cacheService,
      queryService,
      metricService,
      moocletRewardsService
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
      await this.moocletRewardsService.createAndSaveRewardMetric(rewardMetricKey, context[0], logger);
    } catch (error) {
      logger.error({
        message: 'Failed to create reward metric',
        error,
        rewardMetricKey,
      });
      throw error;
    }
    if (!queries.some((query) => query?.metric?.key === rewardMetricKey)) {
      // if it's not already present, append default reward metric query to existing experimentDTO queries before saving
      const defaultRewardMetricQuery = this.moocletRewardsService.getRewardMetricQuery(rewardMetricKey);

      queries.push(defaultRewardMetricQuery);
    }

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
      await this.createAndSaveVersionConditionMapEntities(
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

  private async createAndSaveVersionConditionMapEntities(
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
   * Handles a transaction to edit Mooclet experiment resources with rollback capability.
   *
   * The function performs the following sequential operations:
   * 1. Validates experiment state eligibility (INACTIVE, PREVIEW, SCHEDULED, or ENROLLING)
   * 2. Fetches current resources for comparison with incoming changes
   * 3. Detects experiment design changes that affect Mooclet resources and validates if they're allowed in current state
   * 4. Updates the base experiment via parent class
   * 5. Updates policy parameters (allowed in all eligible states)
   * 6. If version or variable edits exist, applies them with rollback capability
   *
   * If any step fails, the transaction will abort and we will automatically attempt to roll back any Mooclet resources to previous state
   *
   * @param manager - Entity manager passed for transaction handling
   * @param params - Object containing experimentDTO, currentUser, and logger
   * @returns Promise resolving to updated ExperimentDTO
   * @throws Error if experiment state is ineligible or if disallowed changes are detected
   */
  private async handleEditMoocletTransaction(manager: EntityManager, params: SyncEditParams): Promise<ExperimentDTO> {
    const { experimentDTO: incomingExperiment, currentUser, logger } = params;
    const rollbackRef: EditRollbackRef = {
      revertPolicyParameters: null,
      revertOutcomeVariableName: null,
      restoreVersions: null,
      revertVersionModifications: null,
      removeVersions: null,
      currentMoocletExperimentRef: null,
      currentExperiment: null,
    };

    // bail if the experiment is in not in an eligible edit state for mooclet resources
    if (
      ![
        EXPERIMENT_STATE.INACTIVE,
        EXPERIMENT_STATE.PREVIEW,
        EXPERIMENT_STATE.SCHEDULED,
        EXPERIMENT_STATE.ENROLLING,
      ].includes(incomingExperiment.state)
    ) {
      const error = {
        message: '[Mooclet Edit] Ineligible experiment state for Mooclet edits',
        state: incomingExperiment.state,
      };
      logger.error({ error: JSON.stringify(error) });
      throw new Error(JSON.stringify(error));
    }

    // NOTE: Currently allowed states for updating mooclet resources:
    // conditions (versions): PREVIEW, SCHEDULED, INACTIVE
    // outcome variable name: PREVIEW, SCHEDULED, INACTIVE
    // policy parameters: ENROLLING, PREVIEW, SCHEDULED, INACTIVE

    try {
      // ---------- fetch current resources for comparison to incoming -------------------------------
      const {
        currentMoocletExperimentRef,
        currentOutcomeVariableResponse,
        currentPolicyParametersResponse,
        currentExperiment,
      } = await this.fetchCurrentResources(incomingExperiment, logger);

      const versionOrVariableEdits = this.detectExperimentDesignChanges(
        incomingExperiment,
        currentMoocletExperimentRef,
        currentOutcomeVariableResponse.name
      );

      // bail if disallowed changes are detected for enrolling experiments
      if (versionOrVariableEdits && EXPERIMENT_STATE.ENROLLING === incomingExperiment.state) {
        const error = {
          message: '[Mooclet Edit] Ineligible version or variable edits detected for an active Mooclet experiment.',
          changes: versionOrVariableEdits,
        };
        logger.error({ error: JSON.stringify(error) });
        throw new Error(JSON.stringify(error));
      }

      logger.debug({
        message: '[Mooclet Edit] Experiment changes affect Mooclet resources, begin sync.',
        changes: versionOrVariableEdits,
      });

      // ---------- update the experiment first ---------------------------------------
      const updatedExperiment = await super.update(incomingExperiment, currentUser, logger, manager);

      rollbackRef.currentExperiment = currentExperiment;
      rollbackRef.currentMoocletExperimentRef = currentMoocletExperimentRef;

      // ---------- update policy parameters ------------------------------------------
      // NOTE: the rollbackRef is mutated within these methods and will be used to revert changes if any step fails

      // go ahead and PUT policy parameters (these are allowed when enrolling and not really worth checking for changes)
      const policyParameterResponse = await this.doRevertablePolicyParameterChange({
        incomingExperiment,
        currentMoocletExperimentRef,
        currentPolicyParametersResponse,
        rollbackRef,
        logger,
      });

      updatedExperiment.moocletPolicyParameters = policyParameterResponse.parameters;

      // --------- update outcome variable name and/or versions ----------------------

      if (!versionOrVariableEdits) {
        return updatedExperiment;
      }

      await this.doRevertableVersionOrVariableEdits({
        versionOrVariableEdits,
        currentMoocletExperimentRef,
        currentOutcomeVariableResponse,
        incomingExperiment,
        rollbackRef,
        manager,
        logger,
      });

      return updatedExperiment;
    } catch (error) {
      logger.error({ message: '[Mooclet Edits] Error updating experiment', error });
      await this.rollbackMoocletEdits(rollbackRef, logger);
      throw error;
    }
  }

  /**
   * Detects if the outcome variable name has changed between the incoming experiment and current state.
   *
   * @param incomingExperimentDTO - The updated experiment data being submitted
   * @param currentOutcomeVariableName - The current outcome variable name stored in Mooclet
   * @returns The new outcome variable name if changed, or null if unchanged
   */
  private detectNewOutcomeVariableName(
    incomingExperimentDTO: ExperimentDTO,
    currentOutcomeVariableName: string
  ): string | null {
    const newName = incomingExperimentDTO.moocletPolicyParameters['outcome_variable_name'];

    return newName !== currentOutcomeVariableName ? newName : null;
  }

  /**
   * Identifies conditions that exist in the incoming experiment but not in the current Mooclet experiment.
   *
   * @param incomingExperimentDTO - The updated experiment data being submitted
   * @param currentMoocletExperimentRef - The current Mooclet experiment reference
   * @returns Array of new conditions if any are found, or null if no new conditions
   */
  private detectNewConditions(
    incomingExperimentDTO: ExperimentDTO,
    currentMoocletExperimentRef: MoocletExperimentRef
  ): ConditionValidator[] | null {
    const newConditions = incomingExperimentDTO.conditions.filter(
      (condition) =>
        !currentMoocletExperimentRef.versionConditionMaps.find((map) => map.experimentCondition.id === condition.id)
    );

    return newConditions.length ? newConditions : null;
  }

  /**
   * Identifies conditions that exist in the current Mooclet experiment but not in the incoming experiment.
   *
   * @param incomingExperimentDTO - The updated experiment data being submitted
   * @param currentMoocletExperimentRef - The current Mooclet experiment reference
   * @returns Array of version-condition maps for removed conditions if any are found, or null if no conditions were removed
   */
  private detectRemovedConditions(
    incomingExperimentDTO: ExperimentDTO,
    currentMoocletExperimentRef: MoocletExperimentRef
  ): MoocletVersionConditionMap[] | null {
    const mapsForRemovedConditions = currentMoocletExperimentRef.versionConditionMaps.filter(
      (map) => !incomingExperimentDTO.conditions.find((condition) => condition.id === map.experimentCondition.id)
    );

    return mapsForRemovedConditions.length ? mapsForRemovedConditions : null;
  }

  /**
   * Identifies conditions whose code has been modified between the incoming experiment and the current Mooclet experiment.
   *
   * @param incomingExperimentDTO - The updated experiment data being submitted
   * @param currentMoocletExperimentRef - The current Mooclet experiment reference
   * @returns Array of version-condition maps for modified conditions if any are found, or null if no conditions were modified
   */
  private detectModifiedConditions(
    incomingExperimentDTO: ExperimentDTO,
    currentMoocletExperimentRef: MoocletExperimentRef
  ): MoocletVersionConditionMap[] | null {
    const versionsToUpdate = currentMoocletExperimentRef.versionConditionMaps.filter((map) => {
      const condition = incomingExperimentDTO.conditions.find(
        (condition) => condition.id === map.experimentCondition.id
      );

      if (!condition) {
        return null;
      }

      return condition && condition.conditionCode !== map.experimentCondition.conditionCode;
    });

    return versionsToUpdate.length ? versionsToUpdate : null;
  }

  /**
   * Aggregates all experiment design changes by calling individual detection methods.
   *
   * Checks for changes in outcome variable name, added conditions, removed conditions,
   * and modified conditions. Returns an object containing all detected changes, or false
   * if no changes were detected.
   *
   * @param incomingExperimentDTO - The updated experiment data being submitted
   * @param currentMoocletExperimentRef - The current Mooclet experiment reference
   * @param currentOutcomeVariableName - The current outcome variable name stored in Mooclet
   * @returns Object with all detected changes if any exist, or false if no changes were detected
   */
  private detectExperimentDesignChanges(
    incomingExperimentDTO: ExperimentDTO,
    currentMoocletExperimentRef: MoocletExperimentRef,
    currentOutcomeVariableName: string
  ): AllowedInactiveStateChanges | null {
    const changes = {
      newOutcomeVariableName: this.detectNewOutcomeVariableName(incomingExperimentDTO, currentOutcomeVariableName),
      addedConditions: this.detectNewConditions(incomingExperimentDTO, currentMoocletExperimentRef),
      removedConditions: this.detectRemovedConditions(incomingExperimentDTO, currentMoocletExperimentRef),
      modifiedConditions: this.detectModifiedConditions(incomingExperimentDTO, currentMoocletExperimentRef),
    };

    const hasChanges = Object.values(changes).some((change) => !!change);

    return hasChanges ? changes : null;
  }

  /**
   * Updates policy parameters for a Mooclet experiment.
   *
   * This method updates the policy parameters of a Mooclet experiment in response to
   * experiment design changes. It forwards the request to the
   * Mooclet data service.
   *
   * @param newPolicyParameters - The updated policy parameters to apply
   * @param currentMoocletExperimentRef - Reference to the current Mooclet experiment
   * @param logger - Logger instance for recording operation details
   * @returns Promise resolving to the updated policy parameters response from Mooclet
   */
  private async handleUpdatePolicyParameters(
    newPolicyParameters: MoocletPolicyParametersDTO,
    currentMoocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
  ): Promise<MoocletPolicyParametersResponseDetails> {
    return this.moocletDataService.updatePolicyParameters(
      currentMoocletExperimentRef.policyParametersId,
      {
        mooclet: currentMoocletExperimentRef.moocletId,
        policy: currentMoocletExperimentRef.policyId,
        parameters: newPolicyParameters,
      },
      logger
    );
  }

  /**
   * Updates the outcome variable name for a Mooclet experiment.
   *
   * This method will be used both to update and potentially rollback the outcome variable name
   *
   * @param newOutcomeVariableName - The new name for the outcome variable
   * @param currentMoocletExperimentRef - Reference to the current Mooclet experiment
   * @param logger - Logger instance for recording operation details
   * @returns Promise that resolves when the update is complete
   */
  private async handleUpdateOutcomeVariableName(
    newOutcomeVariableName: string,
    currentMoocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
  ): Promise<MoocletVariableResponseDetails> {
    return this.moocletDataService.updateVariable(
      currentMoocletExperimentRef.variableId,
      {
        name: newOutcomeVariableName,
      },
      logger
    );
  }

  /**
   * Removes conditions from a Mooclet experiment.
   *
   * This method deletes versions from Mooclet that correspond to experiment conditions
   * that have been removed from the experiment design. It
   * processes each removal in parallel.
   *
   * @param removedConditions - Array of version-condition maps for conditions to remove
   * @param logger - Logger instance for recording operation details
   * @returns Promise resolving to an array of void results, one for each deleted version
   */
  private async handleRemoveConditions(
    removedConditions: MoocletVersionConditionMap[],
    logger: UpgradeLogger
  ): Promise<void[]> {
    return Promise.all(
      removedConditions.map(async (map) => {
        return await this.moocletDataService.deleteVersion(map.moocletVersionId, logger);
      })
    );
  }

  /**
   * Modifies conditions in a Mooclet experiment.
   *
   * This method updates versions in Mooclet to reflect changes to their corresponding
   * experiment conditions. It retrieves each version, updates its name and text fields
   * if they differ from the incoming condition, and updates the version in Mooclet.
   *
   * @param versionMapsToUpdate - Array of version-condition maps for conditions to modify
   * @param incomingExperiment - The updated experiment data containing modified conditions
   * @param logger - Logger instance for recording operation details
   * @returns Promise resolving to the array of updated version-condition maps
   */
  private async handleModifyConditions(
    versionMapsToUpdate: MoocletVersionConditionMap[],
    incomingExperiment: ExperimentDTO | Experiment,
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

  /**
   * Adds new conditions to a Mooclet experiment.
   *
   * This method creates new versions in Mooclet for conditions that have been added to
   * the experiment design. It creates each version in parallel, and
   * then creates mappings between the new versions and their corresponding conditions.
   *
   * @param addedConditions - Array of conditions to add to the Mooclet experiment
   * @param currentMoocletExperimentRef - Reference to the current Mooclet experiment
   * @returns Promise resolving to an array of newly created version-condition maps
   */
  private async handleAddConditions(
    addedConditions: ExperimentCondition[] | ConditionValidator[],
    currentMoocletExperimentRef: MoocletExperimentRef,
    logger: UpgradeLogger
  ): Promise<MoocletVersionConditionMap[]> {
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

  /**
   * Updates an outcome variable name with rollback capability.
   *
   * @param options - Object containing:
   *   @param newOutcomeVariableName - New name for the outcome variable
   *   @param currentMoocletExperimentRef - Reference to the current Mooclet experiment
   *   @param currentOutcomeVariableName - Current name of the outcome variable
   *   @param rollbackRef - Reference object to store rollback information
   *   @param logger - Logger instance
   * @returns Promise that resolves when the name change is complete
   */
  async doRevertablePolicyParameterChange({
    incomingExperiment,
    currentMoocletExperimentRef,
    currentPolicyParametersResponse,
    rollbackRef,
    logger,
  }) {
    logger.debug({
      message: '[Mooclet Edit] Upserting policy parameters due to experiment design change',
      incomingPolicyParameters: incomingExperiment.moocletPolicyParameters,
    });
    const policyParametersResponse = await this.handleUpdatePolicyParameters(
      incomingExperiment.moocletPolicyParameters,
      currentMoocletExperimentRef,
      logger
    );

    rollbackRef.revertPolicyParameters = currentPolicyParametersResponse.parameters;
    return policyParametersResponse;
  }

  /**
   * Executes revertable edits to versions or variables within a Mooclet experiment.
   * Handles changes to outcome variable names, condition modifications, additions, and removals
   * with built-in rollback capability if any step fails.
   *
   * @param options - Object containing:
   *   @param versionOrVariableEdits - Changes to make to versions or variables
   *   @param currentMoocletExperimentRef - Reference to the current Mooclet experiment
   *   @param currentOutcomeVariableResponse - Current outcome variable data
   *   @param incomingExperiment - New experiment configuration
   *   @param manager - Entity manager for database operations
   *   @param logger - Logger instance
   *   @param rollbackRef - Reference object to store rollback information
   * @returns Promise that resolves when all edits are complete
   * @throws Will throw the first encountered error if any task fails
   */
  async doRevertableVersionOrVariableEdits({
    versionOrVariableEdits,
    currentMoocletExperimentRef,
    currentOutcomeVariableResponse,
    incomingExperiment,
    manager,
    logger,
    rollbackRef,
  }) {
    const { newOutcomeVariableName, addedConditions, removedConditions, modifiedConditions } = versionOrVariableEdits;

    const taskPromises = [];

    if (newOutcomeVariableName) {
      taskPromises.push(
        this.doRevertableOutcomeVariableNameChange({
          newOutcomeVariableName,
          currentMoocletExperimentRef,
          currentOutcomeVariableName: currentOutcomeVariableResponse.name,
          rollbackRef,
          logger,
        })
      );
    }

    if (removedConditions) {
      taskPromises.push(this.doRevertableRemovedConditions({ removedConditions, rollbackRef, logger }));
    }

    if (modifiedConditions) {
      taskPromises.push(
        this.doRevertableModifiedConditions({
          modifiedConditions,
          incomingExperiment,
          experimentRefId: currentMoocletExperimentRef.id,
          manager,
          rollbackRef,
          logger,
        })
      );
    }

    if (addedConditions) {
      taskPromises.push(
        this.doRevertableAddConditions({ addedConditions, currentMoocletExperimentRef, manager, rollbackRef, logger })
      );
    }

    // Use Promise.allSettled to let all tasks complete or fail independently
    const results = await Promise.allSettled(taskPromises);

    // Check if any tasks failed
    const failures = results.filter((result) => result.status === 'rejected');

    if (failures.length > 0) {
      // Log all the errors that occurred
      failures.forEach((failure, index) => {
        logger.error({
          message: `[Mooclet Edit] Task ${index} failed during version or variable edits.`,
          error: failure.reason,
        });
      });

      // Throw the first error to signal failure to the caller
      // The rollbackRef will already be populated with all successful operations
      throw failures[0].reason;
    }
  }

  /**
   * Updates an outcome variable name with rollback capability.
   *
   * @param options - Object containing:
   *   @param newOutcomeVariableName - New name for the outcome variable
   *   @param currentMoocletExperimentRef - Reference to the current Mooclet experiment
   *   @param currentOutcomeVariableName - Current name of the outcome variable
   *   @param rollbackRef - Reference object to store rollback information
   *   @param logger - Logger instance
   * @returns Promise that resolves when the name change is complete
   */
  async doRevertableOutcomeVariableNameChange({
    newOutcomeVariableName,
    currentMoocletExperimentRef,
    currentOutcomeVariableName,
    rollbackRef,
    logger,
  }) {
    logger.debug({
      message: '[Mooclet Edit] Updating outcome variable name due to experiment design change.',
      newOutcomeVariableName,
    });

    await this.handleUpdateOutcomeVariableName(newOutcomeVariableName, currentMoocletExperimentRef, logger);
    rollbackRef.revertOutcomeVariableName = currentOutcomeVariableName;
  }

  /**
   * Removes conditions from a Mooclet experiment with rollback capability.
   *
   * @param options - Object containing:
   *   @param removedConditions - Conditions to be removed
   *   @param rollbackRef - Reference object to store rollback information
   *   @param logger - Logger instance
   * @returns Promise that resolves when condition removal is complete
   */
  async doRevertableRemovedConditions({ removedConditions, rollbackRef, logger }) {
    logger.debug({
      message: '[Mooclet Edit] Removing versions from Mooclet due to experiment design change.',
      removedConditions,
    });

    await this.handleRemoveConditions(removedConditions, logger);
    rollbackRef.restoreVersions = removedConditions.map((map: MoocletVersionConditionMap) => map.experimentCondition);
  }

  /**
   * Modifies conditions in a Mooclet experiment with rollback capability.
   *
   * @param options - Object containing:
   *   @param modifiedConditions - Conditions to be modified
   *   @param incomingExperiment - New experiment configuration
   *   @param experimentRefId - ID of the experiment reference
   *   @param manager - Entity manager for database operations
   *   @param rollbackRef - Reference object to store rollback information
   *   @param logger - Logger instance
   * @returns Promise that resolves when condition modifications are complete
   */
  async doRevertableModifiedConditions({
    modifiedConditions,
    incomingExperiment,
    experimentRefId,
    manager,
    rollbackRef,
    logger,
  }) {
    logger.debug({
      message: '[Mooclet Edit] Modifying versions from Mooclet due to experiment design change.',
      modifiedConditions,
    });

    const modifiedVersionConditionMaps = await this.handleModifyConditions(
      modifiedConditions,
      incomingExperiment,
      logger
    );

    await this.createAndSaveVersionConditionMapEntities(manager, experimentRefId, modifiedVersionConditionMaps, logger);

    rollbackRef.revertVersionModifications = modifiedConditions;
  }

  /**
   * Adds conditions to a Mooclet experiment with rollback capability.
   *
   * @param options - Object containing:
   *   @param addedConditions - Conditions to be added
   *   @param currentMoocletExperimentRef - Reference to the current Mooclet experiment
   *   @param manager - Entity manager for database operations
   *   @param rollbackRef - Reference object to store rollback information
   *   @param logger - Logger instance
   * @returns Promise that resolves when condition additions are complete
   */
  async doRevertableAddConditions({ addedConditions, currentMoocletExperimentRef, manager, rollbackRef, logger }) {
    logger.debug({
      message: '[Mooclet Edit] Adding conditions to Mooclet due to experiment design change.',
      addedConditions,
    });

    const addedVersionConditionMaps = await this.handleAddConditions(
      addedConditions,
      currentMoocletExperimentRef,
      logger
    );

    await this.createAndSaveVersionConditionMapEntities(
      manager,
      currentMoocletExperimentRef.id,
      addedVersionConditionMaps,
      logger
    );

    rollbackRef.removeVersions = addedVersionConditionMaps;
  }

  /**
   * Fetches all current resources related to a Mooclet experiment.
   *
   * @param incomingExperiment - The experiment configuration to retrieve resources for
   * @param logger - Logger instance for operation logging
   * @returns Promise that resolves to an object containing the current Mooclet experiment reference,
   *          policy parameters, outcome variable response, and current experiment
   */
  async fetchCurrentResources(incomingExperiment: ExperimentDTO, logger: UpgradeLogger) {
    const currentMoocletExperimentRef = await this.getMoocletExperimentRefByUpgradeExperimentId(incomingExperiment.id);

    const [currentPolicyParametersResponse, currentOutcomeVariableResponse, currentExperiment] = await Promise.all([
      this.moocletDataService.getPolicyParameters(currentMoocletExperimentRef.policyParametersId, logger),
      this.moocletDataService.getVariable(currentMoocletExperimentRef.variableId, logger),
      this.experimentRepository.findOne({
        where: { id: incomingExperiment.id },
        relations: ['conditions'],
      }),
    ]);

    return {
      currentMoocletExperimentRef,
      currentPolicyParametersResponse,
      currentOutcomeVariableResponse,
      currentExperiment,
    };
  }

  /**
   * Rolls back changes made to Mooclet experiment resources in case of transaction failure.
   *
   * This method attempts to restore the Mooclet experiment to its previous state when
   * an error occurs during the edit process. It systematically reverses each type of
   * change that may have been made:
   *
   * 1. Reverts policy parameters to their original values
   * 2. Restores the original outcome variable name
   * 3. Recreates versions that were deleted
   * 4. Reverts modifications to existing versions
   * 5. Removes versions that were newly added
   *
   * If an error occurs during the rollback process itself, a critical error is logged
   * and thrown, indicating that the experiment resources may be in an inconsistent state.
   *
   * @param rollbackRef - Reference object containing all the data needed for rollback operations
   * @param logger - Logger instance for recording rollback operation details
   * @returns Promise that resolves when rollback is complete
   * @throws Error if the rollback itself fails, indicating resources are likely out of sync
   */
  private async rollbackMoocletEdits(rollbackRef: EditRollbackRef, logger: UpgradeLogger): Promise<void> {
    logger.error({
      message: '[Mooclet Edit] Rolling back Mooclet edits',
      rollbackRef,
    });

    const {
      revertPolicyParameters,
      revertOutcomeVariableName,
      restoreVersions,
      revertVersionModifications,
      removeVersions,
      currentMoocletExperimentRef,
      currentExperiment,
    } = rollbackRef;

    try {
      if (revertPolicyParameters) {
        logger.debug({
          message: '[Mooclet Edit] Will attempt to reverting policy parameters to previous state',
          revertPolicyParameters,
          currentMoocletExperimentRef,
        });
        await this.handleUpdatePolicyParameters(revertPolicyParameters, currentMoocletExperimentRef, logger);
      }

      if (revertOutcomeVariableName) {
        logger.debug({
          message: '[Mooclet Edit] Will attempt to revert outcome variable name to previous state',
          revertOutcomeVariableName,
          currentMoocletExperimentRef,
        });
        await this.handleUpdateOutcomeVariableName(revertOutcomeVariableName, currentMoocletExperimentRef, logger);
      }

      if (restoreVersions) {
        logger.debug({
          message: '[Mooclet Edit] Will attempt to restore deleted versions to previous state',
          restoreVersions,
        });
        await this.handleAddConditions(restoreVersions, currentMoocletExperimentRef, logger);
      }

      if (revertVersionModifications) {
        logger.debug({
          message: '[Mooclet Edit] Will attempt to revert modified versions to previous state',
          revertVersionModifications,
        });
        await this.handleModifyConditions(revertVersionModifications, currentExperiment, logger);
      }

      if (removeVersions) {
        logger.debug({
          message: '[Mooclet Edit] Will attempt to remove added versions to previous state',
          removeVersions,
        });
        await this.handleRemoveConditions(removeVersions, logger);
      }
    } catch (rollbackError) {
      const error = {
        message:
          '[Mooclet Edit] Error during rollback, Mooclet resources are likely out of sync for this experiment! Check the resources noted in the rollback ref.',
        error: rollbackError,
        rollbackRef,
      };
      logger.error(error);
      throw new Error(JSON.stringify(error));
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
      moocletExperimentRef.outcomeVariableName = moocletPolicyParameters['outcome_variable_name'];
    } catch (err) {
      await this.orchestrateDeleteMoocletResources(moocletExperimentRef, logger);
      throw err;
    }

    moocletExperimentRef.id = uuid();

    return moocletExperimentRef;
  }

  private createMoocletVersionConditionMaps(
    versions: MoocletVersionResponseDetails[],
    conditions: ConditionValidator[] | ExperimentCondition[]
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
      const error = {
        message:
          '[Mooclet Deletion]: Failed to delete Mooclet resources, please check manually for out of sync resources',
        error: err,
        moocletExperimentRef: moocletExperimentRef,
      };

      logger.error({
        message:
          '[Mooclet Deletion]: Failed to delete Mooclet resources, please check manually for out of sync resources',
        error: err,
        moocletExperimentRef: moocletExperimentRef,
      });
      throw new Error(JSON.stringify(error));
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
        experiment.conditions.map(async (condition) => this.createNewVersion(condition, moocletResponse.id, logger))
      );
    } catch (err) {
      throw new Error(`Failed to create Mooclet versions: ${err}`);
    }
  }

  private async createNewVersion(
    upgradeCondition: ConditionValidator | ExperimentCondition,
    moocletId: number,
    logger: UpgradeLogger
  ): Promise<MoocletVersionResponseDetails> {
    const newVersionRequest: MoocletVersionRequestBody = {
      mooclet: moocletId,
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

  public async handleEnrollCondition(
    experimentId: string,
    condition: string,
    logger: UpgradeLogger
  ): Promise<void | ExperimentCondition> {
    if (!env.mooclets.enabled) {
      logger.error({
        message: 'Mooclet experiment algorithm is indicated but mooclets are not enabled',
      });
      return undefined;
    }

    // Note: Unlike regular experiments where we infer the condition the user "should" have gotten,
    // we have to enroll the condition the client has marked, because the Mooclet assignment won't persist on a user basis.
    // This means that outside factors can potentially influence the intended balance.

    try {
      const moocletExperimentRef = await this.getMoocletExperimentRefByUpgradeExperimentId(experimentId);

      if (!moocletExperimentRef) {
        const error = {
          message: `[Mooclet Mark Condition] No MoocletExperimentRef found for experiment id ${experimentId}`,
        };
        logger.error(error);
        throw new Error(JSON.stringify(error));
      }
      const versionConditionMap = moocletExperimentRef.versionConditionMaps.find(
        (expCondition) => expCondition.experimentCondition.conditionCode === condition
      );

      if (!versionConditionMap) {
        const error = {
          message: `[Mooclet Mark Condition] No version found for condition ${condition}`,
          moocletExperimentRef,
        };
        logger.error(error);
        throw new Error(JSON.stringify(error));
      }
      return versionConditionMap.experimentCondition;
    } catch (err) {
      logger.error({
        message: '[Mooclet Mark Condition] There was an error processing marked condition.',
        err,
      });
      throw err;
    }
  }
}
