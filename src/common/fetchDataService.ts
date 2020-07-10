import { Interfaces, Types } from '../identifiers';
import * as fetch from 'isomorphic-fetch';

// Call this function with url and data which is used in body of request
export default async function fetchDataService(url: string, token: string, data: any, requestType: Types.REQUEST_TYPES, sendAsAnalytics = false): Promise<Interfaces.IResponse> {
  const requestCount = 0;
  const requestThreshold = 5;
  return await fetchDataFromDB(url, token, data, requestType, requestCount, requestThreshold, sendAsAnalytics);
}

async function fetchDataFromDB(url: string, token: string, data: any, requestType: Types.REQUEST_TYPES, requestCount: number, requestThreshold: number, sendAsAnalytics = false): Promise<Interfaces.IResponse> {
  try {

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    if (!!token) {
      headers.append('Authorization', `Bearer ${token}`);
    }

    
    let options: any = {
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
    // If name, endpoint and message appears in response then its error
    const status = !responseData.name && !responseData.endPoint && !responseData.message;
    return {
      status,
      data: responseData
    };
  } catch (error) {
    requestCount++;
    if (requestCount === requestThreshold) {
      return {
        status: false,
        message: error
      };
    }
    return await fetchDataFromDB(url, token, data, requestType, requestCount, requestThreshold);
  }
}