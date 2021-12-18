import Container from 'typedi';
import { MetricService } from '../../api/services/MetricService';
import { env } from '../../env';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';

export function InitMetrics(): Promise<any> {
  const metricService: MetricService = Container.get(MetricService);
  // Init default metrics in system
  if (env.initialization.metrics) {
    try {
      return metricService.saveAllMetrics(JSON.parse(env.initialization.metrics), new UpgradeLogger());
    } catch (error) { 
      error = new Error('Error while initializing metrics');
      throw error;
    }
  }
  return Promise.resolve();
}
