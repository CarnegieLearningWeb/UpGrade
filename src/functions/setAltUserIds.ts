import { Types, Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';

export default async function setAltUserIds(
  url: string,
  userId: string,
  token: string,
  altUserIds: string[]
): Promise<Interfaces.IExperimentUser[]> {
  try {
    const data = {
      userId,
      aliases: altUserIds
    };
    const response = await fetchDataService(url, token, data, Types.REQUEST_TYPES.POST);
    if (response.status) {
      return response.data;
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}
