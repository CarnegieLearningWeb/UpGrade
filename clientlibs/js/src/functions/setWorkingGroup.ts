import { UpGradeClientInterfaces, UpGradeClientEnums } from '../types';
import fetchDataService from '../common/fetchDataService';

export default async function setWorkingGroup(
  httpClient: UpGradeClientInterfaces.IHttpClientWrapper,
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  workingGroup: Record<string, string>
): Promise<UpGradeClientInterfaces.IUser> {
  const response = await fetchDataService(
    httpClient,
    url,
    token,
    clientSessionId,
    { id: userId, workingGroup: workingGroup },
    UpGradeClientEnums.REQUEST_TYPES.PATCH
  );
  if (response.status) {
    return response.data;
  } else {
    throw new Error(JSON.stringify(response.message));
  }
}
