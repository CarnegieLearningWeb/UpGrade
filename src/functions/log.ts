import { Types, Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';
import { ILogInput } from 'upgrade_types';
import * as fetch from 'isomorphic-fetch';

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

/**
 * 
 * @param url URL of the host to send the analytics to
 * @param userId id of the user
 * @param token additional token to add to the header
 * @param value data to be sent to the server
 */
export function sendAnalytics(
  url: string,
  userId: string,
  token: string,
  value: ILogInput[]
): void {

  const data = {
    userId,
    value
  };

  let headers: any = {
    'Content-Type': 'application/json',
  };

  if (!!token) {
    headers = {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  const body = JSON.stringify(data);

  fetch(url, {
    method: 'POST',
    keepalive: true,
    body,
    headers
  });
}
