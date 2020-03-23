import DataService from './common/dataService';
import { Interfaces } from './identifiers';
import fetchDataService from './common/fetchDataService';
import convertMapToObj from './common/convertMapToObj';

export default async function setWorkingGroup(workingGroup: Map<string, string>): Promise<Interfaces.IUser> {
  try {
    if (!(workingGroup instanceof Map)) {
      throw new Error('Working group type should be Map<string, string>');
    }
    const config = DataService.getData('commonConfig')
    const setWorkingGroupUrl = config.api.setWorkingGroup;
    const id = config.userId;
    const workingGroupObj = convertMapToObj(workingGroup);
    const response = await fetchDataService(setWorkingGroupUrl, { id, workingGroup: workingGroupObj });
    if (response.status) {
      const group = DataService.getData('group');
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