import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';

export default async function markExperimentPoint(url: string, userId: string, token: string, experimentPoint: string, condition: string|null, partitionId?: string): Promise<Interfaces.IMarkExperimentPoint> {
  try {
    let data: any = {
      experimentPoint,
      userId,
      condition
    }
    if (partitionId) {
      data = {
        ...data,
        partitionId
      }
    }
    const response = await fetchDataService(url, token, data, Types.REQUEST_TYPES.POST);
    if (response.status) {
      return {
        userId,
        experimentId: partitionId,
        experimentPoint,
        condition
      }
    } else {
      throw new Error(JSON.stringify(response.message));
    }
  } catch (error) {
    throw new Error(error.message);
  }
}