import { ExperimentDTO } from '../DTO/ExperimentDTO';

/**
 * Contract for an adaptive assignment algorithm's per-experiment config lifecycle
 * (Thompson Sampling today). Each implementation checks experiment.assignmentAlgorithm
 * itself and no-ops when it doesn't apply, so callers can dispatch to every registered
 * implementation without branching on algorithm.
 */
export interface AdaptiveExperimentConfigService {
  createConfigIfApplicable(experiment: ExperimentDTO, createdExperiment: ExperimentDTO): Promise<void>;
  syncConfigIfApplicable(experiment: ExperimentDTO, updatedExperiment: ExperimentDTO): Promise<void>;
  attachConfigToExperiment<T extends ExperimentDTO>(experiment: T): Promise<T>;
}
