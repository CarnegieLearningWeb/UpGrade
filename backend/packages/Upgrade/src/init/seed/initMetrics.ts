import Container from 'typedi';
import { SERVER_ERROR } from 'upgrade_types';
import { MetricService } from '../../api/services/MetricService';
import { env } from '../../env';

export function InitMetrics(): Promise<any> {
  const metricService: MetricService = Container.get(MetricService);
  // Init default metrics in system
  if (env.initialization.metrics) {
    try {
      return metricService.saveAllMetrics(JSON.parse(env.initialization.metrics));
    } catch (error) { 
      error = new Error('Error while initializing metrics');
      (error as any).type = SERVER_ERROR.QUERY_FAILED;
      throw error;
    }
  }
  return Promise.resolve();
}
