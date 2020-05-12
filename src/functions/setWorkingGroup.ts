import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import convertMapToObj from '../common/convertMapToObj';

export default async function setWorkingGroup(url: string, userId: string, token: string, workingGroup: Map<string, string>): Promise<Interfaces.IUser> {
  try {
    if (!(workingGroup instanceof Map)) {
      throw new Error('Working group type should be Map<string, string>');
    }
    const workingGroupObj = convertMapToObj(workingGroup);
    const response = await fetchDataService(url, token, { id: userId, workingGroup: workingGroupObj }, Types.REQUEST_TYPES.POST);
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