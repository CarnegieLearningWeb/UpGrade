import { Types, Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';

export default async function setAltUserIds(
  customHttpClient: Interfaces.ICustomHttpClient,
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  altUserIds: string[]
): Promise<Interfaces.IExperimentUserAliases[]> {
  const data = {
    userId,
    aliases: altUserIds,
  };
  const skipRetryOnStatusCodes = [500]; // Response status codes for which request retry should be skipped on failure
  const response = await fetchDataService(
    customHttpClient,
    url,
    token,
    clientSessionId,
    data,
    Types.REQUEST_TYPES.PATCH,
    false,
    skipRetryOnStatusCodes
  );
  if (response.status) {
    return response.data;
  } else {
    throw new Error(JSON.stringify(response.message));
  }
}
