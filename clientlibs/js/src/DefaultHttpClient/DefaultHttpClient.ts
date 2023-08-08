import { UpGradeClientInterfaces, UpGradeClientEnums } from '../types';
import axios, { AxiosHeaders, AxiosRequestConfig } from 'axios';

declare const IS_BROWSER: boolean;
interface FetchDataParams {
  url: string;
  method: UpGradeClientEnums.REQUEST_METHOD;
  body?: any;
  headers?: UpGradeClientInterfaces.IUpgradeApiRequestHeaders;
  clientSessionId?: string;
  token?: string;
  retries?: number;
  backOff?: number;
}

export class DefaultHttpClient implements UpGradeClientInterfaces.IHttpClientWrapper {
  private skipRetryOnStatusCodes: number[] = [];
  public config: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig = {
    customHeaders: null,
    token: null,
    clientSessionId: null,
  };

  constructor(config?: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig) {
    if (config) {
      this.config = config;
    }
  }

  public async get(url: string): Promise<any> {
    return this.fetchData({
      url,
      method: UpGradeClientEnums.REQUEST_METHOD.GET,
    });
  }
  public async post<RequestBodyType>(url: string, body: RequestBodyType): Promise<any> {
    return this.fetchData({ url, method: UpGradeClientEnums.REQUEST_METHOD.POST, body });
  }

  public async patch<RequestBodyType>(url: string, body: RequestBodyType): Promise<any> {
    return this.fetchData({ url, method: UpGradeClientEnums.REQUEST_METHOD.PATCH, body });
  }

  private async wait(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // TODO break this down
  private async fetchData<ResponseType>({
    url,
    method,
    body,
    retries = 3,
    backOff = 300,
  }: FetchDataParams): Promise<ResponseType> {
    try {
      const headers = { ...this.config.customHeaders };
      const clientSource = IS_BROWSER ? 'Browser' : 'Node';
      headers.CurrentRetry = retries.toString();

      if (clientSource) headers['Client-source'] = clientSource;
      if (this.config.clientSessionId) headers['Session-Id'] = this.config.clientSessionId;
      if (this.config.token) headers.Authorization = `Bearer ${this.config.token}`;

      let axiosRequestConfig: AxiosRequestConfig = {
        headers,
        method,
      };

      if (method === UpGradeClientEnums.REQUEST_METHOD.POST || method === UpGradeClientEnums.REQUEST_METHOD.PATCH) {
        axiosRequestConfig = {
          ...axiosRequestConfig,
          data: body,
        };
      }

      const response = await axios({
        url,
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
