import DataService from './common/dataService';
import { Interfaces } from './identifiers';
import fetchDataService from './common/fetchDataService';
import convertMapToObj from './common/convertMapToObj';

export default async function init(userId: string, hostUrl: string, groupInfo?: Interfaces.IUserGroup): Promise<Interfaces.IUser> {
  try {
    let isGroupMemberShipCorrect = true;
    let isWorkingGroupCorrect = true;

    DataService.setConfigData(userId, hostUrl);

    if (groupInfo && groupInfo.group) {
      isGroupMemberShipCorrect = groupInfo.group instanceof Map;
      if (!isGroupMemberShipCorrect) {
        throw new Error('Group type should be Map<string, Array<string>>');
      }
    }

    if (groupInfo && groupInfo.workingGroup) {
      isWorkingGroupCorrect = groupInfo.workingGroup instanceof Map;
      if (!isWorkingGroupCorrect) {
        throw new Error('Working group type should be Map<string, string>');
      }
    }

    if (isWorkingGroupCorrect && isGroupMemberShipCorrect) {
      let data: any = {
        id: userId
      };

      // Set group membership if group is passed
      if (groupInfo && groupInfo.group) {
        const group = convertMapToObj(groupInfo.group);
        data = {
          ...data,
          group
        };
        DataService.setData('group', groupInfo.group);
      }

      // Set working group if working group is passed
      if (groupInfo && groupInfo.workingGroup) {
        const workingGroup = convertMapToObj(groupInfo.group);
        data = {
          ...data,
          workingGroup
        };
        DataService.setData('workingGroup', groupInfo.workingGroup);
      }

      DataService.setData('experimentConditionData', null);
      const commonConfig = DataService.getData('commonConfig')
      const initUrl = commonConfig.api.init;
      const res = await fetchDataService(initUrl, data);
      if (res.status) {
        return {
          id: userId,
          group: groupInfo.group,
          workingGroup: groupInfo.workingGroup
        }
      } else {
        throw new Error(res.message);
      }
    }
  } catch (error) {
    throw new Error(error);
  }
}