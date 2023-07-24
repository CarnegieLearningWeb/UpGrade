import { UpGradeClientEnums, UpGradeClientInterfaces } from '../types';
import fetchDataService from '../common/fetchDataService';
import { ISingleMetric, IGroupMetric } from 'upgrade_types';

export default async function addMetrics(
  url: string,
  token: string,
  clientSessionId: string,
  metrics: (ISingleMetric | IGroupMetric)[]
): Promise<UpGradeClientInterfaces.IMetric[]> {
  const response = await fetchDataService(
    url,
    token,
    clientSessionId,
    { metricUnit: metrics },
    UpGradeClientEnums.REQUEST_TYPES.POST
  );
  if (response.status) {
    response.data = response.data.map((metric: UpGradeClientInterfaces.IMetric) => {
      return metric;
    });
    return response.data;
  } else {
    throw new Error(JSON.stringify(response.message));
  }
}
