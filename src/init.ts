import * as responseError from './common/responseError';
import DataService from './common/dataService';
import { Interfaces, Types } from './identifiers';
import getAllExperimentConditions from './getAllExperimentConditions';
import setGroupMembership from './setGroupMembership';
import setWorkingGroup from './setWorkingGroup';
import validateGroupMembership from './common/validateGroupMembership';
import validateWorkingGroup from './common/validateWorkingGroup';

interface UserGroup {
  group?: any;
  workingGroup?: any;
}

export default async function init(userId: string, hostUrl: string, groupInfo?: UserGroup): Promise<Interfaces.IResponse> {
  try {
    let isGetAllExperimentConditionsDone = false;
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
      if (groupInfo && groupInfo.group) {
        isGetAllExperimentConditionsDone = true;
        const res = await setGroupMembership(groupInfo.group);
        if (!res.status) {
          return res;
        }
      }
      if (groupInfo && groupInfo.workingGroup) {
        isGetAllExperimentConditionsDone = true;
        const res = await setWorkingGroup(groupInfo.workingGroup);
        if (!res.status) {
          return res;
        }
      }
      if (!isGetAllExperimentConditionsDone) {
        await getAllExperimentConditions();
      }
      return {
          status: true,
          message: Types.ResponseMessages.SUCCESS
      }
    }
  } catch (e) {
    throw new responseError.HttpsError(
      responseError.FunctionsErrorCode.unknown,
      e.message
    );
  }
}