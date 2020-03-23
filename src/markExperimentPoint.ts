import DataService from './common/dataService';
import { Interfaces } from './identifiers';
import fetchDataService from './common/fetchDataService';

export default async function markExperimentPoint(experimentPoint: string, partitionId?: string): Promise<Interfaces.IMarkExperimentPoint> {
  try {
    const config = DataService.getData('commonConfig');
    const markExperimentPointUrl = config.api.markExperimentPoint;
    const userId = config.userId;
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
    const response = await fetchDataService(markExperimentPointUrl, data);
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