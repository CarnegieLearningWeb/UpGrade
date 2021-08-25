import { Service } from 'typedi';

@Service()
export default class FeatureFlagServiceMock {
  public find(): Promise<[]> {
    return Promise.resolve([]);
  }
}
