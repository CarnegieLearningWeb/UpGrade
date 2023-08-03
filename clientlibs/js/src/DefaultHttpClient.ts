import { UpGradeClientInterfaces, UpGradeClientEnums } from './types';
import axios, { AxiosRequestConfig } from 'axios';
import * as uuid from 'uuid';

export class DefaultHttpClient implements UpGradeClientInterfaces.IHttpClientWrapper {
  private skipRetryOnStatusCodes: number[] = [];

  constructor(private clientSessionId?: string, private token?: string, private sendAsAnalytics = false) {}
  public async get(url: string): Promise<any> {
    return this.fetchData(url, UpGradeClientEnums.REQUEST_TYPES.GET);
  }
  public async post<RequestBodyType>(url: string, data: RequestBodyType): Promise<any> {
    return this.fetchData(url, UpGradeClientEnums.REQUEST_TYPES.POST, data);
  }

  public async patch<RequestBodyType>(url: string, data: RequestBodyType): Promise<any> {
    return this.fetchData(url, UpGradeClientEnums.REQUEST_TYPES.PATCH, data);
  }

  private async wait(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private async fetchData(
    url: string,
    requestType: UpGradeClientEnums.REQUEST_TYPES,
    data?: any,
    // options: UpGradeClientInterfaces.IRequestOptions,
    retries = 3,
    backOff = 300
  ): Promise<UpGradeClientInterfaces.IResponse> {
    try {
      let headers: Record<string, any> = {
        'Content-Type': 'application/json',
        'Session-Id': this.clientSessionId || uuid.v4(),
        CurrentRetry: retries,
        URL: url,
      };
      if (this.token) {
        headers = {
          ...headers,
          Authorization: `Bearer ${this.token}`,
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
        if (this.sendAsAnalytics) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const http = require('http');
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const https = require('https');
          options.httpAgent = new http.Agent({ keepAlive: true });
          options.httpsAgent = new https.Agent({ keepAlive: true });
        }
      }

      if (
        requestType === UpGradeClientEnums.REQUEST_TYPES.POST ||
        requestType === UpGradeClientEnums.REQUEST_TYPES.PATCH
      ) {
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
        if (this.skipRetryOnStatusCodes.includes(response.status)) {
          return {
            status: false,
            message: responseData,
          };
        }

        if (retries > 0) {
          // Do retry after the backOff time
          await this.wait(backOff);
          return await this.fetchData(
            url,
            requestType,
            data,
            // options,
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
}
