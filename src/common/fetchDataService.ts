import { Interfaces } from '../identifiers';
import * as fetch from 'isomorphic-fetch';

// Call this function with url and data which is used in body of request
export default async function fetchDataService(url: string, token: string, data: any): Promise<Interfaces.IResponse> {
  const requestCount = 0;
  const requestThreshold = 5;
  return await fetchDataFromDB(url, token, data, requestCount, requestThreshold);
}

async function fetchDataFromDB(url: string, token: string, data: any, requestCount: number, requestThreshold: number): Promise<Interfaces.IResponse> {
  try {
    const response = await fetch(url, {
      body: JSON.stringify(data),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return {
      status: true,
      data: await response.json()
    };
  } catch (error) {
    requestCount++;
    if (requestCount === requestThreshold) {
      return {
        status: false,
        message: error
      };
    }
    return await fetchDataFromDB(url, token, data, requestCount, requestThreshold);
  }
}