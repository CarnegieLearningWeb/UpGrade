import { UpGradeClientEnums, UpGradeClientInterfaces } from '../types';
import fetchDataService from '../common/fetchDataService';

export default async function setAltUserIds(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  altUserIds: string[]
): Promise<UpGradeClientInterfaces.IExperimentUserAliases[]> {
  const data = {
    userId,
    aliases: altUserIds,
  };
  const skipRetryOnStatusCodes = [500]; // Response status codes for which request retry should be skipped on failure
  const response = await fetchDataService(
    url,
    token,
    clientSessionId,
    data,
    UpGradeClientEnums.REQUEST_TYPES.PATCH,
    false,
    skipRetryOnStatusCodes
  );
  if (response.status) {
    return response.data;
  } else {
    throw new Error(JSON.stringify(response.message));
  }
}
