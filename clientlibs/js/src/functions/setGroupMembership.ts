import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import convertMapToObj from '../common/convertMapToObj';

export default async function setGroupMembership(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  group: Record<string, Array<string>>
): Promise<Interfaces.IUser> {
  try {
    const response = await fetchDataService(
      url,
      token,
      clientSessionId,
      { id: userId, group: group },
      Types.REQUEST_TYPES.PATCH
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
