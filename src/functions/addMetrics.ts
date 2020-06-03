import { Types, Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';

export default async function addMetrics(
  url: string,
  token: string,
  metrics: Interfaces.MetricUnit[]
): Promise<Interfaces.IMetric[]> {
  try {
    const response = await fetchDataService(url, token, { metricUnit: metrics }, Types.REQUEST_TYPES.POST);
    if (response.status) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // If type is not array then it is an error
      throw new Error(response.data);
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}
