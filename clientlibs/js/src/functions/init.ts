import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import convertMapToObj from '../common/convertMapToObj';

export default async function init(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  group?: Map<string, Array<string>>,
  workingGroup?: Map<string, string>,
): Promise<Interfaces.IUser> {
  try {
    let data: any = {
      id: userId,
    };

    if (group) {
      if (!(group instanceof Map)) {
        throw new Error('Group type should be Map<string, Array<string>>');
      }
      const groupObj = convertMapToObj(group);
      data = {
        ...data,
        groupObj
      }
    }

    if (workingGroup) {
      if (!(workingGroup instanceof Map)) {
        throw new Error('Working group type should be Map<string, string>');
      }
      const workingGroupObj = convertMapToObj(workingGroup);
      data = {
        ...data,
        workingGroupObj
      }
    }

    const response = await fetchDataService(url, token, clientSessionId, data, Types.REQUEST_TYPES.POST);
    if (response.status) {
      return response.data;
    } else {
      throw new Error(JSON.stringify(response.message));
    }
  } catch (error) {
    throw new Error(error.message);
  }
}
