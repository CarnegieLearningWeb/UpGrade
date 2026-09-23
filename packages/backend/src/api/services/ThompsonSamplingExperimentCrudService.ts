import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { ThompsonSamplingExperimentConfigRepository } from '../repositories/ThompsonSamplingExperimentConfigRepository';
import { ConditionPosteriorStateRepository } from '../repositories/ConditionPosteriorStateRepository';
import { ThompsonSamplingExperimentConfig } from '../models/ThompsonSamplingExperimentConfig';
import { ThompsonSamplingService } from './ThompsonSamplingService';
import { CacheService } from './CacheService';
import { ASSIGNMENT_ALGORITHM, CACHE_PREFIX, ExperimentRewardsSummary } from 'upgrade_types';
import { ExperimentDTO } from '../DTO/ExperimentDTO';
import { AdaptiveExperimentConfigService } from './AdaptiveExperimentConfigService';

type ConditionRef = { id: string };

export interface ThompsonSamplingConfigParams {
  warmupThreshold?: number;
  minimumDrawDifference?: number;
  batchSize?: number;
  /** Beta priors per condition, keyed by conditionId. Defaults to Beta(1,1) for missing entries. */
  priors?: Record<string, { success: number; failure: number }>;
}

@Service()
export class ThompsonSamplingExperimentCrudService implements AdaptiveExperimentConfigService {
  constructor(
    @InjectRepository() private configRepository: ThompsonSamplingExperimentConfigRepository,
    @InjectRepository() private posteriorStateRepository: ConditionPosteriorStateRepository,
    private thompsonSamplingService: ThompsonSamplingService,
    private cacheService: CacheService
  ) {}

  public async getConfigForExperiment(experimentId: string): Promise<ThompsonSamplingExperimentConfig | null> {
    return this.configRepository.findByExperimentId(experimentId);
  }

  /**
   * Single gate for "does this experiment need a Thompson Sampling config", so every experiment
   * creation path (single create, bulk import, batch create) gets config/posterior rows the same
   * way instead of each caller re-checking assignmentAlgorithm itself. Only `priors`/`warmupThreshold`/
   * `batchSize`/`minimumDrawDifference` from `experiment.thompsonSamplingConfig` are ever read here —
   * there is no field for success/failure counts, so posterior state always starts at zero regardless
   * of what the caller's source experiment (e.g. an imported/exported one) previously accumulated.
   *
   * `priors` is keyed by whatever condition IDs the caller submitted (client-generated temp IDs on
   * create, or the previously-exported IDs on import), but ExperimentService.create()/deduceConditions()
   * replace every condition ID with a freshly generated one before/while persisting — so those keys
   * never match `createdExperiment.conditions[].id` on their own. `originalConditionIds` (captured by
   * the caller before create() ran) lets remapPriorsToNewConditionIds() translate them.
   */
  public async createConfigIfApplicable(
    experiment: ExperimentDTO,
    createdExperiment: ExperimentDTO,
    originalConditionIds?: string[]
  ): Promise<void> {
    if (experiment.assignmentAlgorithm !== ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING) {
      return;
    }
    const remappedConfig = this.remapPriorsToNewConditionIds(
      experiment.thompsonSamplingConfig,
      originalConditionIds,
      createdExperiment.conditions
    );
    await this.createConfig(createdExperiment.id, createdExperiment.conditions, remappedConfig ?? {});
  }

  /**
   * Translates a priors record keyed by pre-creation condition IDs onto the condition IDs the
   * experiment actually ended up with. Both `originalConditionIds` and `newConditions` are produced
   * by order-preserving map/forEach transforms all the way through ExperimentService's create/import
   * pipeline (conditions are never reordered, only replaced in place), so corresponding entries at the
   * same array index refer to the same condition — there is no other stable, unique-per-condition key
   * available to correlate on (ExperimentCondition.twoCharacterId was removed; conditionCode is not
   * guaranteed unique). Without this, every condition would silently fall back to the default
   * Beta(1,1) prior whenever the caller's condition IDs get regenerated.
   */
  private remapPriorsToNewConditionIds(
    config: ThompsonSamplingConfigParams | undefined,
    originalConditionIds: string[] | undefined,
    newConditions: ConditionRef[]
  ): ThompsonSamplingConfigParams | undefined {
    if (!config?.priors || !originalConditionIds) {
      return config;
    }

    const remappedPriors: Record<string, { success: number; failure: number }> = {};
    originalConditionIds.forEach((oldId, index) => {
      const prior = config.priors?.[oldId];
      const newId = newConditions[index]?.id;
      if (prior && newId) {
        remappedPriors[newId] = prior;
      }
    });

    return { ...config, priors: remappedPriors };
  }

  /**
   * Update-path counterpart to createConfigIfApplicable: keeps posterior rows in sync with the
   * current condition list and applies any prior/threshold changes, only for Thompson Sampling
   * experiments. Also handles both directions of an algorithm change on an existing experiment:
   * switching TO Thompson Sampling creates the config that createConfigIfApplicable never got a
   * chance to (this is an update, not the original create), and switching AWAY FROM it deletes any
   * config left over from before, so the reward path can't keep treating a now-non-adaptive
   * experiment as Thompson Sampling.
   */
  public async syncConfigIfApplicable(experiment: ExperimentDTO, updatedExperiment: ExperimentDTO): Promise<void> {
    if (updatedExperiment.assignmentAlgorithm !== ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING) {
      await this.deleteConfigIfExists(updatedExperiment.id);
      return;
    }

    const existingConfig = await this.getConfigForExperiment(updatedExperiment.id);
    if (!existingConfig) {
      await this.createConfig(
        updatedExperiment.id,
        updatedExperiment.conditions,
        experiment.thompsonSamplingConfig ?? {}
      );
      return;
    }

    await this.syncConditions(updatedExperiment.id, updatedExperiment.conditions);
    if (experiment.thompsonSamplingConfig) {
      await this.updateConfig(updatedExperiment.id, experiment.thompsonSamplingConfig);
    }
  }

  /**
   * Populates `experiment.thompsonSamplingConfig` from the stored config/posterior rows for API
   * responses and experiment export. Only ever reads `priorSuccess`/`priorFailure` (the Beta seed) —
   * never `successCount`/`failureCount` — so exporting an experiment and re-importing it carries the
   * configured priors forward without also carrying forward accumulated reward evidence.
   */
  public async attachConfigToExperiment<T extends ExperimentDTO>(experiment: T): Promise<T> {
    if (experiment?.assignmentAlgorithm !== ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING) {
      return experiment;
    }
    const config = await this.getConfigForExperiment(experiment.id);
    if (!config) {
      return experiment;
    }
    experiment.thompsonSamplingConfig = {
      warmupThreshold: config.warmupThreshold,
      minimumDrawDifference: config.minimumDrawDifference,
      batchSize: config.batchSize,
      priors: this.thompsonSamplingService.buildPriorsRecord(config.conditionPosteriorStates ?? []),
    };
    return experiment;
  }

  public async createConfig(
    experimentId: string,
    conditions: ConditionRef[],
    params: ThompsonSamplingConfigParams = {}
  ): Promise<ThompsonSamplingExperimentConfig> {
    const config = await this.configRepository.save({
      experimentId,
      warmupThreshold: params.warmupThreshold ?? 0,
      minimumDrawDifference: params.minimumDrawDifference ?? 0,
      batchSize: params.batchSize ?? 1,
    });

    await Promise.all(
      conditions.map((condition) =>
        this.posteriorStateRepository.save({
          conditionId: condition.id,
          priorSuccess: params.priors?.[condition.id]?.success ?? 1,
          priorFailure: params.priors?.[condition.id]?.failure ?? 1,
          successCount: 0,
          totalCount: 0,
        })
      )
    );

    await this.invalidateConfigCache();

    return config;
  }

  public async updateConfig(experimentId: string, params: ThompsonSamplingConfigParams): Promise<void> {
    // Only touch fields the caller actually provided -- `params.field ?? null` would otherwise
    // silently clear any field a partial payload omits, since each is independently optional.
    const fieldsToUpdate: Partial<
      Pick<ThompsonSamplingExperimentConfig, 'warmupThreshold' | 'minimumDrawDifference' | 'batchSize'>
    > = {};
    if (params.warmupThreshold !== undefined) {
      fieldsToUpdate.warmupThreshold = params.warmupThreshold;
    }
    if (params.minimumDrawDifference !== undefined) {
      fieldsToUpdate.minimumDrawDifference = params.minimumDrawDifference;
    }
    if (params.batchSize !== undefined) {
      fieldsToUpdate.batchSize = params.batchSize;
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await this.configRepository.update({ experimentId }, fieldsToUpdate);
    }

    await this.invalidateConfigCache();

    if (!params.priors) {
      return;
    }

    const config = await this.configRepository.findByExperimentId(experimentId);
    if (!config) {
      return;
    }

    await Promise.all(
      Object.entries(params.priors).map(([conditionId, prior]) =>
        this.posteriorStateRepository.update(
          { conditionId },
          {
            priorSuccess: prior?.success ?? 1,
            priorFailure: prior?.failure ?? 1,
          }
        )
      )
    );
  }

  /**
   * Per-condition reward totals and estimated win-rate weight, plus experiment-wide batch/warmup
   * progress, for the reward feedback card display. Read-only aggregation — does not touch
   * ConditionPosteriorState rows (see syncConditions() for that).
   */
  public async getRewardsSummary(experimentId: string): Promise<ExperimentRewardsSummary> {
    const config = await this.configRepository.findByExperimentIdWithConditions(experimentId);

    if (!config) {
      return { conditions: [], pendingRewardsCount: 0, totalRewardCount: 0, warmupThreshold: 0, batchSize: 1 };
    }

    // A reward is only ever buffered (pendingTotalCount > 0) when batchSize > 1 -- unset/<=1 applies
    // immediately, so there's nothing to sum and no batch to cycle through.
    const pendingRewardsCount =
      config.batchSize > 1 ? config.conditionPosteriorStates.reduce((sum, s) => sum + s.pendingTotalCount, 0) : 0;
    // Same measure warmupThreshold gates on in ThompsonSamplingService/ExperimentAssignmentService:
    // flushed evidence plus whatever's still sitting in a pending batch.
    const totalRewardCount = config.conditionPosteriorStates.reduce(
      (sum, s) => sum + s.totalCount + s.pendingTotalCount,
      0
    );

    const rows = config.conditionPosteriorStates.map((state) => {
      const successes = state.successCount;
      const failures = state.failureCount;
      const successRate = state.totalCount > 0 ? ((successes / state.totalCount) * 100).toFixed(1) + '%' : '0.0%';
      const { alpha, beta } = this.thompsonSamplingService.computePosterior(
        state.priorSuccess,
        state.priorFailure,
        state.successCount,
        state.failureCount
      );
      return {
        conditionId: state.conditionId,
        alpha,
        beta,
        conditionCode: state.condition?.conditionCode ?? state.conditionId,
        successes,
        failures,
        successRate,
        order: state.condition?.order ?? 0,
        priorSuccess: state.priorSuccess,
        priorFailure: state.priorFailure,
      };
    });

    // Keyed by conditionId, not conditionCode: conditionCode has no uniqueness constraint (only
    // ExperimentCondition.twoCharacterId is unique), so two conditions sharing a code would
    // otherwise collide in the weight map and silently swap estimatedWeight values.
    const weightMap = this.thompsonSamplingService.estimateConditionWeights(
      rows.map((r) => ({ code: r.conditionId, alpha: r.alpha, beta: r.beta }))
    );

    const conditions = rows
      .map(({ conditionId, alpha: _alpha, beta: _beta, ...rest }) => ({
        ...rest,
        estimatedWeight: weightMap[conditionId],
      }))
      .sort((a, b) => a.order - b.order);

    return {
      conditions,
      pendingRewardsCount,
      totalRewardCount,
      warmupThreshold: config.warmupThreshold,
      batchSize: config.batchSize,
    };
  }

  /**
   * Keeps ConditionPosteriorState rows in sync with the experiment's current conditions.
   * Adds rows for new conditions (using default priors) and removes rows for deleted conditions.
   */
  public async syncConditions(experimentId: string, currentConditions: ConditionRef[]): Promise<void> {
    const config = await this.configRepository.findByExperimentId(experimentId);
    if (!config) return;

    const existingIds = new Set(config.conditionPosteriorStates.map((s) => s.conditionId));
    const currentIds = new Set(currentConditions.map((c) => c.id));

    const toAdd = currentConditions.filter((c) => !existingIds.has(c.id));
    await Promise.all(
      toAdd.map((condition) =>
        this.posteriorStateRepository.save({
          conditionId: condition.id,
          priorSuccess: 1,
          priorFailure: 1,
          successCount: 0,
          totalCount: 0,
        })
      )
    );

    const toRemove = config.conditionPosteriorStates.filter((s) => !currentIds.has(s.conditionId));
    if (toRemove.length > 0) {
      await this.posteriorStateRepository.remove(toRemove);
    }
  }

  /**
   * Deletes the config (and, via ON DELETE CASCADE, its posterior-state rows) when an experiment
   * that used to be Thompson Sampling is switched to a different algorithm. Without this, the
   * config row would linger and ThompsonSamplingExperimentConfigRepository's enrolling-state-only
   * queries would keep finding it, letting the reward path treat a now-non-adaptive experiment as
   * if it were still Thompson Sampling.
   */
  private async deleteConfigIfExists(experimentId: string): Promise<void> {
    const config = await this.configRepository.findByExperimentId(experimentId);
    if (!config) {
      return;
    }
    if (config.conditionPosteriorStates?.length) {
      await this.posteriorStateRepository.remove(config.conditionPosteriorStates);
    }
    await this.configRepository.remove(config);
    await this.invalidateConfigCache();
  }

  /**
   * Clears every cached config lookup ThompsonSamplingRewardService may have made — both the
   * by-experimentId and by-decision-point keys share this prefix. A targeted delete of just the
   * affected experimentId key isn't enough on its own: the decision-point-keyed entries embed the
   * same config fields and there's no cheap way to know which context/site/target keys reference
   * this experiment, so the whole prefix is reset instead (same approach ExperimentService.updateList
   * uses for validExperiments- when a similar can't-cheaply-target-one-key situation comes up).
   */
  private async invalidateConfigCache(): Promise<void> {
    await this.cacheService.resetPrefixCache(CACHE_PREFIX.THOMPSON_SAMPLING_CONFIG_KEY_PREFIX);
  }
}
