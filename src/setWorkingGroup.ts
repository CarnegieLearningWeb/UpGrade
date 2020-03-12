import DataService from './common/dataService';
import * as responseError from './common/responseError';
import { Interfaces, Types } from './identifiers';
import fetchDataService from './common/fetchDataService';
import validateWorkingGroup from './common/validateWorkingGroup';

export default async function setWorkingGroup(workingGroup: any): Promise<Interfaces.IResponse> {
  try {
    const response = validateWorkingGroup(workingGroup);
    if (!response.status) {
      return response;
    }
    const config = DataService.getData('commonConfig')
    const setWorkingGroupUrl = config.api.setWorkingGroup;
    const id = config.userId;
    await fetchDataService(setWorkingGroupUrl, { id, workingGroup });
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