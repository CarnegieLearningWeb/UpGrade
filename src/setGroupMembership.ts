import DataService from './common/dataService';
import { Interfaces } from './identifiers';
import fetchDataService from './common/fetchDataService';
import convertMapToObj from './common/convertMapToObj';

export default async function setGroupMembership(group: Map<string, Array<string>>): Promise<Interfaces.IUser> {
  try {
    if (!(group instanceof Map)) {
      throw new Error('Group type should be Map<string, Array<string>>');
    }
    const commonConfig = DataService.getData('commonConfig')
    const setGroupMembershipUrl = commonConfig.api.setGroupMemberShip;
    const id = commonConfig.userId;
    const groupObj = convertMapToObj(group);
    const response = await fetchDataService(setGroupMembershipUrl, { id, group: groupObj });
    if (response.status) {
      const workingGroup = DataService.getData('workingGroup');
      return {
        id,
        group,
        workingGroup
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}