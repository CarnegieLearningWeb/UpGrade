import { ISingleMetric, IGroupMetric } from 'upgrade_types';
import { Service } from 'typedi';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

@Service()
export default class MetricServiceMock {
  public saveAllMetrics(metricUnit: Array<ISingleMetric | IGroupMetric>): Promise<[]> {
    return Promise.resolve([]);
  }

  public upsertAllMetrics(metrics: Array<IGroupMetric | ISingleMetric>, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public deleteMetric(key: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllMetrics(logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
