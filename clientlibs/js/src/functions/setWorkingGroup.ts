import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import convertMapToObj from '../common/convertMapToObj';

export default async function setWorkingGroup(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  workingGroup: Record<string, string>
): Promise<Interfaces.IUser> {
  try {
    const response = await fetchDataService(
      url,
      token,
      clientSessionId,
      { id: userId, workingGroup: workingGroup },
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
