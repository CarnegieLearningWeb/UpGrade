import * as responseError from './common/responseError';
import DataService from './common/dataService';
import { Interfaces, Types } from './identifiers';
import fetchDataService from './common/fetchDataService';

export default async function markExperimentPoint(experimentPoint: string, partitionId?: string): Promise<Interfaces.IResponse> {
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
    return response ? {
          status: true,
          message: Types.ResponseMessages.SUCCESS
        } : {
          status: false,
          message: Types.ResponseMessages.FAILED
        };
  } catch (e) {
    throw new responseError.HttpsError(
      responseError.FunctionsErrorCode.unknown,
      e.message
    );
  }
}