import { Types, Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { ISingleMetric, IGroupMetric } from 'upgrade_types';

export default async function addMetrics(
  url: string,
  token: string,
  metrics: Array<ISingleMetric | IGroupMetric>
): Promise<Interfaces.IMetric[]> {
  try {
    const response = await fetchDataService(url, token, { metricUnit: metrics }, Types.REQUEST_TYPES.POST);
    if (response.status) {
      response.data = response.data.map(metric => {
        const { createdAt, updatedAt, versionNumber, ...rest } = metric;
        return rest;
      });
      return response.data;
    } else {
      throw new Error(JSON.stringify(response.message));
    }
  } catch (error) {
    throw new Error(error.message);
  }
}
