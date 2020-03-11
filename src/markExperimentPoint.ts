import * as responseError from './common/responseError';
import DataService from './common/dataService';
import { Interfaces, Types } from './identifiers';
import fetchDataService from './common/fetchDataService';

// experimentName is equal to partitionId
export default async function markExperimentPoint(experimentPoint: string, experimentName?: string): Promise<Interfaces.IResponse> {
  try {
    const config = DataService.getData('commonConfig');
    const markExperimentPointUrl = config.api.markExperimentPoint;
    const userId = config.userId;
    let data: any = {
      experimentPoint,
      userId
    }
    if (experimentName) {
      data = {
        ...data,
        partitionId: experimentName
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

    // TODO:  Uncomment code after verifying interested Experiment points

    // const interestedExperimentPoints = DataService.getData('interestedExperimentPoints');
    // if (user && !!experimentName && !!experimentPoint) {
    //   if (interestedExperimentPoints && interestedExperimentPoints.length) {
    //     if (interestedExperimentPoints.indexOf(experimentPoint) !== -1) {
    //       return markExperimentPointForUser(markExperimentPointUrl, experimentName, experimentPoint, user);
    //     } else {
    //       return {
    //         status: false,
    //         message: Types.MARK_INTERESTED_EXPERIMENT_POINT_ERROR
    //       };    
    //     }
    //   } else {
    //     return markExperimentPointForUser(markExperimentPointUrl, experimentName, experimentPoint, user);
    //   }
    // } else {
    //   return {
    //     status: false,
    //     message: Types.ResponseMessages.FAILED
    //   };
    // }
  } catch (e) {
    throw new responseError.HttpsError(
      responseError.FunctionsErrorCode.unknown,
      e.message
    );
  }
}