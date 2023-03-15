import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

export default async function markExperimentPoint(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  site: string,
  condition: string,
  status: MARKED_DECISION_POINT_STATUS,
  target?: string
): Promise<Interfaces.IMarkExperimentPoint> {
  let data: any = {
    site,
    condition,
    userId,
    status,
  };
  if (target) {
    data = {
      ...data,
      target,
    };
  }
  const response = await fetchDataService(url, token, clientSessionId, data, Types.REQUEST_TYPES.POST);
  if (response.status) {
    return response.data;
    // return {
    //   experimentPoint,
    //   experimentId: partitionId,
    //   userId,
    //   condition,
    // };
  } else {
    throw new Error(JSON.stringify(response.message));
  }
}
