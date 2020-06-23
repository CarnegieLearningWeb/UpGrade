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
      if (Array.isArray(response.data)) {
        response.data =  response.data.map(metric => {
          const { createdAt, updatedAt, versionNumber, ...rest } = metric;
          return rest;
        });
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
