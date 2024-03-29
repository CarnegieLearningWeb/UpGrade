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

  public async doGet<ResponseType>(
    url: string,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<ResponseType> {
    return await this.fetchData<ResponseType>({
      url,
      method: UpGradeClientEnums.REQUEST_METHOD.GET,
      options,
    });
  }
  public async doPost<ResponseType, RequestBodyType>(
    url: string,
    body: RequestBodyType,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<ResponseType> {
    return await this.fetchData<ResponseType>({ url, method: UpGradeClientEnums.REQUEST_METHOD.POST, body, options });
  }

  public async doPatch<ResponseType, RequestBodyType>(
    url: string,
    body: RequestBodyType,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<ResponseType> {
    return await this.fetchData<ResponseType>({ url, method: UpGradeClientEnums.REQUEST_METHOD.PATCH, body, options });
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

      const response = await axios({
        ...axiosRequestConfig,
      });

      const responseData = response.data;
      const statusCode = response.status;

      if (statusCode > 400 && statusCode < 500) {
        // If response status code is in the skipRetryOnStatusCodes, or we've run out of retries, don't attempt retry
        if (this.skipRetryOnStatusCodes.includes(statusCode) || retries <= 0) {
          throw new Error(
            JSON.stringify({
              statusCode: statusCode,
              response: responseData,
            })
          );
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
        }
      } else {
        return responseData;
      }
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
}
