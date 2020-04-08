import { Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import convertMapToObj from '../common/convertMapToObj';

export default async function setWorkingGroup(url: string, userId: string, workingGroup: Map<string, string>): Promise<Interfaces.IUser> {
  try {
    if (!(workingGroup instanceof Map)) {
      throw new Error('Working group type should be Map<string, string>');
    }
    const workingGroupObj = convertMapToObj(workingGroup);
    const response = await fetchDataService(url, { id: userId, workingGroup: workingGroupObj });
    if (response.status) {
      return {
        id: userId,
        workingGroup
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}