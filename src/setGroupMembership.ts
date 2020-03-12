import DataService from './common/dataService';
import * as responseError from './common/responseError';
import { Interfaces, Types } from './identifiers';
import fetchDataService from './common/fetchDataService';
import validateGroupMembership from './common/validateGroupMembership';

export default async function setGroupMembership(group: any): Promise<Interfaces.IResponse> {
  try {
    const response = validateGroupMembership(group);
    if (!response.status) {
      return response;
    }
    DataService.setData('userGroups', group);
    const commonConfig = DataService.getData('commonConfig')
    const setGroupMembershipUrl = commonConfig.api.setGroupMemberShip;
    const id = commonConfig.userId;
    await fetchDataService(setGroupMembershipUrl, { id, group });
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