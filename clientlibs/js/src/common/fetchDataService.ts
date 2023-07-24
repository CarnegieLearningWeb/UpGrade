import { UpGradeClientInterfaces, UpGradeClientEnums } from '../types';
import axios, { AxiosRequestConfig } from 'axios';
import * as uuid from 'uuid';

// Call this function with url and data which is used in body of request
export default async function fetchDataService(
  url: string,
  token: string,
  clientSessionId: string,
  data: any,
  requestType: UpGradeClientEnums.REQUEST_TYPES,
  sendAsAnalytics = false,
  skipRetryOnStatusCodes: number[] = []
): Promise<UpGradeClientInterfaces.IResponse> {
  return await fetchData(url, token, clientSessionId, data, requestType, sendAsAnalytics, skipRetryOnStatusCodes);
}

async function fetchData(
  url: string,
  token: string,
  clientSessionId: string,
  data: any,
  requestType: UpGradeClientEnums.REQUEST_TYPES,
  sendAsAnalytics = false,
  skipRetryOnStatusCodes: number[],
  retries = 3, // Retry request 3 times on failure
  backOff = 300
): Promise<UpGradeClientInterfaces.IResponse> {
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

    let options: AxiosRequestConfig = {
      headers,
      method: requestType,
    };

    if (
      typeof window === 'undefined' &&
      typeof process !== 'undefined' &&
      process.release &&
      process.release.name === 'node'
    ) {
      if (sendAsAnalytics) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const http = require('http');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const https = require('https');
        options.httpAgent = new http.Agent({ keepAlive: true });
        options.httpsAgent = new https.Agent({ keepAlive: true });
      }
    }

    if (requestType === UpGradeClientEnums.REQUEST_TYPES.POST || requestType === UpGradeClientEnums.REQUEST_TYPES.PATCH) {
      options = {
        ...options,
        data,
      };
    }

    const response = await axios({
      url,
      ...options,
    }).then((res) => {
      return res;
    });

    const responseData = response.data;
    const statusCode = response.status;

    if (statusCode > 400 && statusCode < 500) {
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
    } else {
      return {
        status: true,
        data: responseData,
      };
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
