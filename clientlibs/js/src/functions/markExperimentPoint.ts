import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

export default async function markExperimentPoint(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  experimentPoint: string,
  condition: string | null,
  status: MARKED_DECISION_POINT_STATUS,
  partitionId?: string
): Promise<Interfaces.IMarkExperimentPoint> {
  try {
    let data: any = {
      experimentPoint,
      userId,
      condition,
      status,
    };
    if (partitionId) {
      data = {
        ...data,
        partitionId,
      };
    }
    const response = await fetchDataService(url, token, clientSessionId, data, Types.REQUEST_TYPES.POST);
    if (response.status) {
      return {
        experimentPoint,
        experimentId: partitionId,
        userId,
        condition,
      };
    } else {
      throw new Error(JSON.stringify(response.message));
    }
  } catch (error) {
    throw new Error(error.message);
  }
}
