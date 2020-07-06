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
    'Content-Type': 'application/json'
  }

  if (!!token) {
    headers = {
      ...headers,
      'Authorization': `Bearer ${token}`
    }
  }

  const blob = new Blob([JSON.stringify(data)], headers);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, blob);
  } else {
    console.error('navigator.sendBeacon not supported');
    // handle with xhr fallback
    const xhr = new XMLHttpRequest();
    xhr.open('post', url, false);
    xhr.send(blob);
  }
}
