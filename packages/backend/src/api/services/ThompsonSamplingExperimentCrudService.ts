import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { ThompsonSamplingExperimentConfigRepository } from '../repositories/ThompsonSamplingExperimentConfigRepository';
import { ConditionPosteriorStateRepository } from '../repositories/ConditionPosteriorStateRepository';
import { ThompsonSamplingExperimentConfig } from '../models/ThompsonSamplingExperimentConfig';
import { ThompsonSamplingService } from './ThompsonSamplingService';
import { ExperimentRewardsSummary } from 'upgrade_types';

type ConditionRef = { id: string };

export interface ThompsonSamplingConfigParams {
  warmupThreshold?: number;
  minimumDrawDifference?: number;
  batchSize?: number;
  /** Beta priors per condition, keyed by conditionId. Defaults to Beta(1,1) for missing entries. */
  priors?: Record<string, { success: number; failure: number }>;
}

@Service()
export class ThompsonSamplingExperimentCrudService {
  constructor(
    @InjectRepository() private configRepository: ThompsonSamplingExperimentConfigRepository,
    @InjectRepository() private posteriorStateRepository: ConditionPosteriorStateRepository,
    private thompsonSamplingService: ThompsonSamplingService
  ) {}

  public async getConfigForExperiment(experimentId: string): Promise<ThompsonSamplingExperimentConfig | null> {
    return this.configRepository.findByExperimentId(experimentId);
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
   * Keeps ConditionPosteriorState rows in sync with the experiment's current conditions.
   * Adds rows for new conditions (using default priors) and removes rows for deleted conditions.
   */
  public async getRewardsSummary(experimentId: string): Promise<ExperimentRewardsSummary> {
    const config = await this.configRepository
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.conditionPosteriorStates', 'states')
      .leftJoinAndSelect('states.condition', 'condition')
      .where('config.experimentId = :experimentId', { experimentId })
      .getOne();

    if (!config) return [];

    const rows = config.conditionPosteriorStates.map((state) => {
      const successes = state.successCount;
      const failures = state.totalCount - state.successCount;
      const successRate = state.totalCount > 0 ? ((successes / state.totalCount) * 100).toFixed(1) + '%' : '0.0%';
      const alpha = state.priorSuccess + state.successCount;
      const beta = state.priorFailure + (state.totalCount - state.successCount);
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
}
