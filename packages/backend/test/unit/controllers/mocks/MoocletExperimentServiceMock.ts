import { SyncCreateParams } from '../../../../src/api/services/MoocletExperimentService';
import { Service } from 'typedi';

@Service()
export default class MoocletExperimentServiceMock {
  public async syncCreate(params: SyncCreateParams): Promise<[]> {
    return Promise.resolve([]);
  }
}
