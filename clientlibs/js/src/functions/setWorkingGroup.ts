import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import convertMapToObj from '../common/convertMapToObj';

export default async function setWorkingGroup(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  workingGroup: Map<string, string>
): Promise<Interfaces.IUser> {
  try {
    if (!(workingGroup instanceof Map)) {
      throw new Error('Working group type should be Map<string, string>');
    }
    const workingGroupObj = convertMapToObj(workingGroup);
    const response = await fetchDataService(
      url,
      token,
      clientSessionId,
      { id: userId, workingGroup: workingGroupObj },
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
