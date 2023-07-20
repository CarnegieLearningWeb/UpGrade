import { UpGradeClientInterfaces, UpGradeClientEnums } from '../types';
import fetchDataService from '../common/fetchDataService';

export default async function setGroupMembership(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  group: Record<string, Array<string>>
): Promise<UpGradeClientInterfaces.IUser> {
  const response = await fetchDataService(
    url,
    token,
    clientSessionId,
    { id: userId, group: group },
    UpGradeClientEnums.REQUEST_TYPES.PATCH
  );
  if (response.status) {
    return response.data;
  } else {
    throw new Error(JSON.stringify(response.message));
  }
}
