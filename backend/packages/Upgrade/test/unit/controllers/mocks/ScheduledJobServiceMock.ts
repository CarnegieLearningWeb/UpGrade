import { Service } from 'typedi';

@Service()
export default class ScheduledJobServiceMock {
  public startExperiment(id: string): any {
    return {};
  }

  public endExperiment(id: string): any {
    return {};
  }
}
