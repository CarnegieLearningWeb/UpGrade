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
   */
  public async createConfigIfApplicable(experiment: ExperimentDTO, createdExperiment: ExperimentDTO): Promise<void> {
    if (experiment.assignmentAlgorithm !== ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING) {
      return;
    }
    await this.createConfig(
      createdExperiment.id,
      createdExperiment.conditions,
      experiment.thompsonSamplingConfig ?? {}
    );
  }

  /**
   * Update-path counterpart to createConfigIfApplicable: keeps posterior rows in sync with the
   * current condition list and applies any prior/threshold changes, only for Thompson Sampling
   * experiments.
   */
  public async syncConfigIfApplicable(experiment: ExperimentDTO, updatedExperiment: ExperimentDTO): Promise<void> {
    if (experiment.assignmentAlgorithm !== ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING) {
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
      warmupThreshold: params.warmupThreshold ?? null,
      minimumDrawDifference: params.minimumDrawDifference ?? null,
      batchSize: params.batchSize ?? null,
    });

    await Promise.all(
      conditions.map((condition) =>
        this.posteriorStateRepository.save({
          configId: config.id,
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
    await this.configRepository.update(
      { experimentId },
      {
        warmupThreshold: params.warmupThreshold ?? null,
        minimumDrawDifference: params.minimumDrawDifference ?? null,
        batchSize: params.batchSize ?? null,
      }
    );

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
          { configId: config.id, conditionId },
          {
            priorSuccess: prior?.success ?? 1,
            priorFailure: prior?.failure ?? 1,
          }
        )
      )
    );
  }

  /**
   * Per-condition reward totals and estimated win-rate weight for the experiment overview/summary
   * display. Read-only aggregation — does not touch ConditionPosteriorState rows (see
   * syncConditions() for that).
   */
  public async getRewardsSummary(experimentId: string): Promise<ExperimentRewardsSummary> {
    const config = await this.configRepository.findByExperimentIdWithConditions(experimentId);

    if (!config) return [];

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
        code: state.condition?.conditionCode ?? state.conditionId,
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

    const weightMap = this.thompsonSamplingService.estimateConditionWeights(
      rows.map((r) => ({ code: r.code, alpha: r.alpha, beta: r.beta }))
    );

    return rows
      .map(({ code: _code, alpha: _alpha, beta: _beta, ...rest }) => ({
        ...rest,
        estimatedWeight: weightMap[rest.conditionCode],
      }))
      .sort((a, b) => a.order - b.order);
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
          configId: config.id,
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
