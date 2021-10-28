import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';

export default async function failedExperimentPoint(
  url: string,
  token: string,
  clientSessionId: string,
  experimentPoint: string,
  reason: string,
  userId: string,
  experimentId?: string
): Promise<Interfaces.IFailedExperimentPoint> {
  try {
    let data: any = {
      experimentPoint,
      reason,
      userId,
    };
    if (experimentId) {
      data = {
        ...data,
        experimentId,
      };
    }
    const response = await fetchDataService(url, token, clientSessionId, data, Types.REQUEST_TYPES.POST);
    if (response.status) {
      return {
        type: response.data.type,
        message: response.data.message,
      };
    } else {
      throw new Error(JSON.stringify(response.message));
    }
  } catch (error) {
    throw new Error(error.message);
  }
}
