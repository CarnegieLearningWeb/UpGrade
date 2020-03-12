import * as responseError from './common/responseError';
import DataService from './common/dataService';
import { Interfaces, Types } from './identifiers';
import validateGroupMembership from './common/validateGroupMembership';
import validateWorkingGroup from './common/validateWorkingGroup';
import fetchDataService from './common/fetchDataService';

interface UserGroup {
  group?: any;
  workingGroup?: any;
}

export default async function init(userId: string, hostUrl: string, groupInfo?: UserGroup): Promise<Interfaces.IResponse> {
  try {
    let isGroupMemberShipCorrect = true;
    let isWorkingGroupCorrect = true;

    DataService.setConfigData(userId, hostUrl);

    if (groupInfo && groupInfo.group) {
      const res = validateGroupMembership(groupInfo.group);
      isGroupMemberShipCorrect = res.status;
      if (!res.status) {
        return res;
      }
    }

    if (groupInfo && groupInfo.workingGroup) {
      const res = validateWorkingGroup(groupInfo.workingGroup);
      isWorkingGroupCorrect = res.status;
      if (!res.status) {
        return res;
      }
    }

    if (isWorkingGroupCorrect && isGroupMemberShipCorrect) {
      let data: any = {
        id: userId
      };

      // Set group membership if group is passed
      data = (groupInfo && groupInfo.group) ? {
        ...data,
        group: groupInfo.group
      } : data;

      // Set working group if working group is passed
      data = (groupInfo && groupInfo.workingGroup) ? {
        ...data,
        workingGroup: groupInfo.workingGroup
      } : data;

      DataService.setData('experimentConditionData', null);
      const commonConfig = DataService.getData('commonConfig')
      const initUrl = commonConfig.api.init;
      const res = await fetchDataService(initUrl, data);
      return res.status ? {
        status: true,
        message: Types.ResponseMessages.SUCCESS
      } : {
          status: false,
          message: Types.ResponseMessages.FAILED
        }
    }
  } catch (e) {
    throw new responseError.HttpsError(
      responseError.FunctionsErrorCode.unknown,
      e.message
    );
  }
}