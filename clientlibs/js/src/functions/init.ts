import { Interfaces, Types } from '../identifiers';
import fetchDataService from '../common/fetchDataService';

export default async function init(
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  group?: Record<string, Array<string>>,
  workingGroup?: Record<string, string>
): Promise<Interfaces.IUser> {
  try {
    let data: any = {
      id: userId,
    };

    if (group) {
      data = {
        ...data,
        group,
      };
    }

    if (workingGroup) {
      data = {
        ...data,
        workingGroup,
      };
    }

    const response = await fetchDataService(url, token, clientSessionId, data, Types.REQUEST_TYPES.POST);
    if (response.status) {
      return response.data;
    } else {
      throw new Error(JSON.stringify(response.message));
    }
  } catch (error) {
    throw new Error(error.message);
  }
}
