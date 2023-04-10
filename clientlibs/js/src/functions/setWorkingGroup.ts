import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';

export default async function setWorkingGroup(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  workingGroup: Record<string, string>
): Promise<Interfaces.IUser> {
  const response = await fetchDataService(
    url,
    token,
    clientSessionId,
    { id: userId, workingGroup: workingGroup },
    Types.REQUEST_TYPES.POST
  );
  if (response.status) {
    return response.data;
  } else {
    throw new Error(JSON.stringify(response.message));
  }
}
