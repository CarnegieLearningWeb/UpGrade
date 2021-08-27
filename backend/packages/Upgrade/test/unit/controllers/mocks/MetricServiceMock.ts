import { ISingleMetric, IGroupMetric } from 'upgrade_types';
import { Service } from 'typedi';

@Service()
export default class MetricServiceMock {
  public saveAllMetrics(metricUnit: Array<ISingleMetric | IGroupMetric>): Promise<[]> {
    return Promise.resolve([]);
  }
}
