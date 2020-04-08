import { Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import convertMapToObj from '../common/convertMapToObj';

export default async function setGroupMembership(url: string, userId: string, group: Map<string, Array<string>>): Promise<Interfaces.IUser> {
  try {
    if (!(group instanceof Map)) {
      throw new Error('Group type should be Map<string, Array<string>>');
    }
    const groupObj = convertMapToObj(group);
    const response = await fetchDataService(url, { id: userId, group: groupObj });
    if (response.status) {
      return {
        id: userId,
        group
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}