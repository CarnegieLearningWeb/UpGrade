import { Interfaces, Types } from '../identifiers';
import * as fetch from 'isomorphic-fetch';
import * as uuid from 'uuid';

// Call this function with url and data which is used in body of request
export default async function fetchDataService(
  url: string,
  token: string,
  clientSessionId: string,
  data: any,
  requestType: Types.REQUEST_TYPES,
  sendAsAnalytics = false,
  skipRetryOnStatusCodes: number[] = []
): Promise<Interfaces.IResponse> {
  return await fetchData(url, token, clientSessionId, data, requestType, sendAsAnalytics, skipRetryOnStatusCodes);
}

async function fetchData(
  url: string,
  token: string,
  clientSessionId: string,
  data: any,
  requestType: Types.REQUEST_TYPES,
  sendAsAnalytics = false,
  skipRetryOnStatusCodes: number[],
  retries = 3, // Retry request 3 times on failure
  backOff = 300
): Promise<Interfaces.IResponse> {
  try {
    let headers: object = {
      'Content-Type': 'application/json',
      'Session-Id': clientSessionId || uuid.v4(),
      CurrentRetry: retries,
      URL: url,
    };
    if (token) {
      headers = {
        ...headers,
        Authorization: `Bearer ${token}`,
      };
    }

    typeof window !== 'undefined'
      ? (headers = { ...headers, 'Client-source': 'Browser' })
      : (headers = { ...headers, 'Client-source': 'Node' });

    let options: Interfaces.IRequestOptions = {
      headers,
      method: requestType,
      keepalive: sendAsAnalytics,
    };

    if (requestType === Types.REQUEST_TYPES.POST || requestType === Types.REQUEST_TYPES.PATCH) {
      options = {
        ...options,
        body: JSON.stringify(data),
      };
    }

    const response = await fetch(url, options);
    const responseData = await response.json();
    // If value of ok is false then it's error
    if (response.ok) {
      return {
        status: true,
        data: responseData,
      };
    } else {
      // If response status code is in the skipRetryOnStatusCodes, don't attempt retry
      if (skipRetryOnStatusCodes.includes(response.status)) {
        return {
          status: false,
          message: responseData,
        };
      }

      if (retries > 0) {
        // Do retry after the backOff time
        await wait(backOff);
        return await fetchData(
          url,
          token,
          clientSessionId,
          data,
          requestType,
          sendAsAnalytics,
          skipRetryOnStatusCodes,
          retries - 1,
          backOff * 2
        );
      } else {
        return {
          status: false,
          message: responseData,
        };
      }
    }
  } catch (error) {
    return {
      status: false,
      message: error,
    };
  }
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
