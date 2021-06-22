import { Interfaces, Types } from '../identifiers';
import * as fetch from 'isomorphic-fetch';

// Call this function with url and data which is used in body of request
export default async function fetchDataService(url: string, token: string, data: any, requestType: Types.REQUEST_TYPES, sendAsAnalytics = false): Promise<Interfaces.IResponse> {
  return await fetchData(url, token, data, requestType, sendAsAnalytics);
}

async function fetchData(url: string, token: string, data: any, requestType: Types.REQUEST_TYPES, sendAsAnalytics = false, retries = 3, backOff = 300): Promise<Interfaces.IResponse> {
  try {

    let headers: object = {
      'Content-Type': 'application/json'
    }
    if (!!token) {
      headers = {
        ...headers,
        'Authorization': `Bearer ${token}`
      }
    }


    let options: Interfaces.IRequestOptions = {
      headers,
      method: requestType,
      keepalive: sendAsAnalytics === true
    };

    if (requestType === Types.REQUEST_TYPES.POST) {
      options = {
        ...options,
        body: JSON.stringify(data)
      }
    }

    const response = await fetch(url, options);
    const responseData = await response.json();
    // If value of ok is false then it's error
    if (response.ok) {
      return {
        status: true,
        data: responseData
      };
    } else {
      // Retryable error codes
      // 408 (Request Timeout)
      // 500 (Internal Server Error)
      // 502 (Bad Gateway)
      // 503 (Service Unavailable)
      // 504 (Gateway Timeout)
      // 522 (Connection timed out)
      const retryCodes = [408, 500, 502, 503, 504, 522];

      if (retries > 0 && retryCodes.includes(response.status)) {
        // Do retry after the backOff time
        await wait(backOff);
        return await fetchData(url, token, data, requestType, sendAsAnalytics, retries - 1, backOff * 2);
      } else {
        return {
          status: false,
          message: responseData
        }
      }
    }
  } catch (error) {
      return {
        status: false,
        message: error
      };
  }
}

async function wait(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}