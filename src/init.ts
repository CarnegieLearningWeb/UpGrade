import * as responseError from './common/responseError';
import DataService from './common/dataService';
import { Interfaces, Types } from './identifiers';
import getAllExperimentConditions from './getAllExperimentConditions';
import setGroupMembership from './setGroupMembership';
import setWorkingGroup from './setWorkingGroup';
import validateGroupMembership from './common/validateGroupMembership';
import validateWorkingGroup from './common/validateWorkingGroup';

export default async function init(userId: string, hostUrl: string, context?: any): Promise<Interfaces.IResponse> {
  try {
    let isGetAllExperimentConditionsDone = false;
    let hasGroupMemberShipCorrect = true;
    let hasWorkingGroupCorrect = true;

    DataService.setConfigData(userId, hostUrl);
    
    if (context && context.group) {
      const res = validateGroupMembership(context.group);
      hasGroupMemberShipCorrect = res.status;
      if (!res.status) {
        return res;
      }
    }

    if (context && context.workingGroup) {
      const res = validateWorkingGroup(context.workingGroup);
      hasWorkingGroupCorrect = res.status;
      if (!res.status) {
        return res;
      }
    }

    if (hasWorkingGroupCorrect && hasGroupMemberShipCorrect) {
      if (context && context.group) {
        isGetAllExperimentConditionsDone = true;
        const res = await setGroupMembership(context.group);
        if (!res.status) {
          return res;
        }
      }
      if (context && context.workingGroup) {
        isGetAllExperimentConditionsDone = true;
        const res = await setWorkingGroup(context.workingGroup);
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