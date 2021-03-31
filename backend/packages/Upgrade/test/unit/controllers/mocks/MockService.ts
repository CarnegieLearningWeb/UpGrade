import { Service } from 'typedi';

@Service()
export default class MockService {
  public find(): Promise<[]> {
    return Promise.resolve([]);
  }
}
