import { Experiment } from '../../../../src/api/models/Experiment';
import { User } from '../../../../src/api/models/User';
import { Service } from 'typedi';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

@Service()
export default class ExperimentServiceMock {
  public createMultipleExperiments(experiment: Experiment[]): Promise<[]> {
    return Promise.resolve([]);
  }

  public importExperiments(experiment: Experiment, currentUser: User): Promise<[]> {
    return Promise.resolve([]);
  }

  public exportExperiment(experimentId: string, user: User, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
