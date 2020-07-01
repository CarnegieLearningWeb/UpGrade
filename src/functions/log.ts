import { Types, Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { ILogInput } from 'upgrade_types';

export default async function log(
  url: string,
  userId: string,
  token: string,
  value: ILogInput[]
): Promise<Interfaces.ILog[]> {
  try {
    const data = {
      userId,
      value
    };
    const logResponse = await fetchDataService(url, token, data, Types.REQUEST_TYPES.POST);
    if (logResponse.status) {
      return logResponse.data;
    } else {
      throw new Error(logResponse.message);
    }
  } catch (error) {
    throw new Error(error);
  }
}
