import { UpGradeClientInterfaces, UpGradeClientEnums } from '../types';
import axios, { AxiosRequestConfig } from 'axios';
import * as uuid from 'uuid';

interface FetchDataParams {
  url: string;
  method: UpGradeClientEnums.REQUEST_METHOD;
  body?: any;
  options?: UpGradeClientInterfaces.IHttpClientWrapperRequestOptions;
  retries?: number;
  backOff?: number;
}

export class DefaultHttpClient implements UpGradeClientInterfaces.IHttpClientWrapper {
  private skipRetryOnStatusCodes: number[] = [];

  constructor(private clientSessionId?: string, private token?: string, private sendAsAnalytics = false) {}
  public async get(url: string, options: UpGradeClientInterfaces.IHttpClientWrapperRequestOptions): Promise<any> {
    return this.fetchData({
      url,
      method: UpGradeClientEnums.REQUEST_METHOD.GET,
      options,
    });
  }
  public async post<RequestBodyType>(
    url: string,
    body: RequestBodyType,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestOptions
  ): Promise<any> {
    return this.fetchData({ url, method: UpGradeClientEnums.REQUEST_METHOD.POST, body, options });
  }

  public async patch<RequestBodyType>(
    url: string,
    body: RequestBodyType,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestOptions
  ): Promise<any> {
    return this.fetchData({ url, method: UpGradeClientEnums.REQUEST_METHOD.PATCH, body, options });
  }

  private async wait(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // TODO break this down
  private async fetchData({
    url,
    method,
    body,
    options,
    retries,
    backOff,
  }: FetchDataParams): Promise<UpGradeClientInterfaces.IResponse> {
    if (!retries) {
      retries = 3;
    }

    if (!backOff) {
      backOff = 300;
    }

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

      // TODO for default client, options may not need to be passed in?
      let options: AxiosRequestConfig = {
        headers,
        method,
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

      if (method === UpGradeClientEnums.REQUEST_METHOD.POST || method === UpGradeClientEnums.REQUEST_METHOD.PATCH) {
        options = {
          ...options,
          data: body,
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
          return await this.fetchData({
            url,
            method,
            body,
            options,
            retries: retries - 1,
            backOff: backOff * 2,
          });
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
