import { Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';

export default async function markExperimentPoint(url: string, userId: string, token: string, experimentPoint: string, partitionId?: string): Promise<Interfaces.IMarkExperimentPoint> {
  try {
    let data: any = {
      experimentPoint,
      userId
    }
    if (partitionId) {
      data = {
        ...data,
        partitionId
      }
    }
    const response = await fetchDataService(url, token, data);
    if (response.status) {
      return {
        userId,
        experimentId: partitionId,
        experimentPoint
      }
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}