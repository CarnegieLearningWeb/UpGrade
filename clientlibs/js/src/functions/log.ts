import { Types, Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { ILogInput } from 'upgrade_types';

export default async function log(
  customHttpClient: Interfaces.ICustomHttpClient,
  url: string,
  userId: string,
  token: string,
  clientSessionId: string,
  value: ILogInput[],
  sendAsAnalytics = false
): Promise<Interfaces.ILog[]> {
  const data = {
    userId,
    value,
  };
  const logResponse = await fetchDataService(
    customHttpClient,
    url,
    token,
    clientSessionId,
    data,
    Types.REQUEST_TYPES.POST,
    sendAsAnalytics
  );
  if (logResponse.status) {
    return logResponse.data;
  } else {
    throw new Error(JSON.stringify(logResponse.message));
  }
}
