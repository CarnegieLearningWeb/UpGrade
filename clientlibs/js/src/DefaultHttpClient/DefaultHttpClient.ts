import { UpGradeClientInterfaces, UpGradeClientEnums } from '../types';
import axios, { AxiosRequestConfig } from 'axios';

interface FetchDataParams {
  url: string;
  method: UpGradeClientEnums.REQUEST_METHOD;
  body?: any;
  options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig;
  clientSessionId?: string;
  token?: string;
  retries?: number;
  backOff?: number;
}

export class DefaultHttpClient implements UpGradeClientInterfaces.IHttpClientWrapper {
  private skipRetryOnStatusCodes: number[] = [];
  public config: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig = null;

  public async get(url: string, options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig): Promise<any> {
    return this.fetchData({
      url,
      method: UpGradeClientEnums.REQUEST_METHOD.GET,
      options,
    });
  }
  public async post<RequestBodyType>(
    url: string,
    body: RequestBodyType,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<any> {
    return this.fetchData({ url, method: UpGradeClientEnums.REQUEST_METHOD.POST, body, options });
  }

  public async patch<RequestBodyType>(
    url: string,
    body: RequestBodyType,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<any> {
    return this.fetchData({ url, method: UpGradeClientEnums.REQUEST_METHOD.PATCH, body, options });
  }

  private async wait(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private async fetchData<ResponseType>({
    url,
    method,
    body,
    options,
    retries = 3,
    backOff = 300,
  }: FetchDataParams): Promise<ResponseType> {
    try {
      options.headers['CurrentRetry'] = retries.toString();

      let axiosRequestConfig: AxiosRequestConfig = {
        url,
        headers: options.headers,
        method,
      };

      if (method === UpGradeClientEnums.REQUEST_METHOD.POST || method === UpGradeClientEnums.REQUEST_METHOD.PATCH) {
        axiosRequestConfig = {
          ...axiosRequestConfig,
          data: body,
        };
      }

      console.log({ axiosRequestConfig });

      const response = await axios({
        ...axiosRequestConfig,
      });

      const responseData = response.data;
      const statusCode = response.status;

      if (statusCode > 400 && statusCode < 500) {
        // If response status code is in the skipRetryOnStatusCodes, don't attempt retry
        if (this.skipRetryOnStatusCodes.includes(response.status)) {
          return responseData;
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
          return responseData;
        }
      } else {
        return responseData;
      }
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
}
