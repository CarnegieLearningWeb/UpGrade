import { Types, Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';

export default async function setAltUserIds(
  url: string,
  userId: string,
  token: string,
  altUserIds: string[]
): Promise<Interfaces.IExperimentUserAliases[]> {
  try {
    const data = {
      userId,
      aliases: altUserIds
    };
    const skipRetryOnStatusCodes = [500]; // Response status codes for which request retry should be skipped on failure
    const response = await fetchDataService(url, token, data, Types.REQUEST_TYPES.POST, false, skipRetryOnStatusCodes);
    if (response.status) {
      return response.data;
    } else {
      throw new Error(JSON.stringify(response.message));
    }
  } catch (error) {
    throw new Error(error.message);
  }
}
