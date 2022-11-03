import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import convertMapToObj from '../common/convertMapToObj';

export default async function setGroupMembership(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  group: Map<string, string[]>
): Promise<Interfaces.IUser> {
  try {
    if (!(group instanceof Map)) {
      throw new Error('Group type should be Map<string, Array<string>>');
    }
    const groupObj = convertMapToObj(group);
    const response = await fetchDataService(
      url,
      token,
      clientSessionId,
      { id: userId, group: groupObj },
      Types.REQUEST_TYPES.POST
    );
    if (response.status) {
      return response.data;
    } else {
      throw new Error(JSON.stringify(response.message));
    }
  } catch (error) {
    throw new Error(error.message);
  }
}
