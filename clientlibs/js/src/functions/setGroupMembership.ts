import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';

export default async function setGroupMembership(
  customHttpClient: Interfaces.ICustomHttpClient,
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  group: Record<string, Array<string>>
): Promise<Interfaces.IUser> {
  const response = await fetchDataService(
    customHttpClient,
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
}
