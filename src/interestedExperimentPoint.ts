import DataService from './common/dataService';
import * as responseError from './common/responseError';
import { Interfaces, Types } from './identifiers';

export default function interestedExperimentPoint(experimentPointList: any[]): Interfaces.IResponse {
  try {
    DataService.setData('interestedExperimentPoints', experimentPointList);
    return {
        status: true,
        message: Types.ResponseMessages.SUCCESS
    }
  } catch (e) {
    throw new responseError.HttpsError(
      responseError.FunctionsErrorCode.unknown,
      e.message
    );
  }
}
