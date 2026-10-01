import { ExperimentDTO } from '../DTO/ExperimentDTO';

/**
 * Contract for an adaptive assignment algorithm's per-experiment config lifecycle
 * (Thompson Sampling today). Each implementation checks experiment.assignmentAlgorithm
 * itself and no-ops when it doesn't apply, so callers can dispatch to every registered
 * implementation without branching on algorithm.
 */
export interface AdaptiveExperimentConfigService {
  /**
   * `originalConditionIds` is the condition ID list exactly as submitted by the caller, captured
   * before ExperimentService.create()/deduceConditions() replace every condition ID with a freshly
   * generated one. Implementations that key caller-supplied data (e.g. priors) by condition ID need
   * this to remap those keys onto `createdExperiment`'s actual (post-creation) condition IDs.
   */
  createConfigIfApplicable(
    experiment: ExperimentDTO,
    createdExperiment: ExperimentDTO,
    originalConditionIds?: string[]
  ): Promise<void>;
  syncConfigIfApplicable(experiment: ExperimentDTO, updatedExperiment: ExperimentDTO): Promise<void>;
  attachConfigToExperiment<T extends ExperimentDTO>(experiment: T): Promise<T>;
}
