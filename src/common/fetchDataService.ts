import { Types } from '../identifiers';
import * as fetch from 'isomorphic-fetch';

// Call this function with url and data which is used in body of request
export default async function fetchDataService(url: string, data: any) {
    const requestCount = 0;
    const requestThreshold = 5;
    return await fetchDataFromDB(url, data, requestCount, requestThreshold);
  }

  async function fetchDataFromDB(url: string, data: any, requestCount: number, requestThreshold: number) {
    try {
        const response = await fetch(url, {
          body: JSON.stringify(data),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return {
            status: true,
            data: await response.json()
          };
      } catch (e) {
        requestCount++;
        if (requestCount === requestThreshold) {
          return {
            status: false,
            message: Types.ResponseMessages.FAILED
          };
        }
        return await fetchDataFromDB(url, data, requestCount, requestThreshold);
      }
  }