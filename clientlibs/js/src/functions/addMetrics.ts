import { Types, Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { ISingleMetric, IGroupMetric } from 'upgrade_types';

export default async function addMetrics(
  url: string,
  token: string,
  clientSessionId: string,
  metrics: (ISingleMetric | IGroupMetric)[]
): Promise<Interfaces.IMetric[]> {
  const response = await fetchDataService(
    url,
    token,
    clientSessionId,
    { metricUnit: metrics },
    Types.REQUEST_TYPES.POST
  );
  if (response.status) {
    response.data = response.data.map(
      (metric: { [x: string]: any; createdAt: any; updatedAt: any; versionNumber: any }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, updatedAt, versionNumber, ...rest } = metric;
        return rest;
      }
    );
    return response.data;
  } else {
    throw new Error(JSON.stringify(response.message));
  }
}
