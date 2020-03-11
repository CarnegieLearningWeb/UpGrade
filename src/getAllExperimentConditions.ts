import DataService from './common/dataService';
import fetchDataService from './common/fetchDataService';
import * as responseError from './common/responseError';
import { Types } from './identifiers';

export default async function getAllExperimentConditions() {
  try {
    const commonConfig = DataService.getData('commonConfig')
    const getAllExperimentConditionsUrl = commonConfig.api.getAllExperimentConditions;
    const userId = commonConfig.userId;
    const experimentConditionResponse = await fetchDataService(getAllExperimentConditionsUrl, { userId });
    DataService.setData('experimentConditionData', experimentConditionResponse.data ? experimentConditionResponse.data : []);
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