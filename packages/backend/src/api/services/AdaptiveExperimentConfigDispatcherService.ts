import { Service } from 'typedi';
import { ExperimentDTO } from '../DTO/ExperimentDTO';
import { AdaptiveExperimentConfigService } from './AdaptiveExperimentConfigService';
import { ThompsonSamplingExperimentCrudService } from './ThompsonSamplingExperimentCrudService';

/**
 * Fans the config lifecycle for an experiment out to every registered adaptive
 * algorithm's config service. Each service self-gates on assignmentAlgorithm, so
 * adding a second adaptive algorithm means adding its service to `services` here --
 * no branching needed at the call sites in ExperimentController/ImportExportService.
 */
@Service()
export class AdaptiveExperimentConfigDispatcherService implements AdaptiveExperimentConfigService {
  private readonly services: AdaptiveExperimentConfigService[];

  constructor(thompsonSamplingCrudService: ThompsonSamplingExperimentCrudService) {
    this.services = [thompsonSamplingCrudService];
  }

  public async createConfigIfApplicable(experiment: ExperimentDTO, createdExperiment: ExperimentDTO): Promise<void> {
    for (const service of this.services) {
      await service.createConfigIfApplicable(experiment, createdExperiment);
    }
  }

  public async syncConfigIfApplicable(experiment: ExperimentDTO, updatedExperiment: ExperimentDTO): Promise<void> {
    for (const service of this.services) {
      await service.syncConfigIfApplicable(experiment, updatedExperiment);
    }
  }

  public async attachConfigToExperiment<T extends ExperimentDTO>(experiment: T): Promise<T> {
    let result = experiment;
    for (const service of this.services) {
      result = await service.attachConfigToExperiment(result);
    }
    return result;
  }
}
