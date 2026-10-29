import { UpGradeClientInterfaces, UpGradeClientEnums } from '../types';
import axios, { AxiosRequestConfig } from 'axios';

const DEFAULT_TIMEOUT_MS = 5000;

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
    options.headers['CurrentRetry'] = retries.toString();

    let axiosRequestConfig: AxiosRequestConfig = {
      url,
      headers: options.headers,
      method,
      timeout: DEFAULT_TIMEOUT_MS,
    };

    if (method === UpGradeClientEnums.REQUEST_METHOD.POST || method === UpGradeClientEnums.REQUEST_METHOD.PATCH) {
      axiosRequestConfig = {
        ...axiosRequestConfig,
        data: body,
      };
    }

    try {
      const response = await axios(axiosRequestConfig);
      return response.data;
    } catch (error) {
      // axios rejects every non-2xx response, so retry decisions are made here. Only requests ApiService marks
      // retryable (reads and idempotent upserts) are resent: a timeout or 5xx doesn't mean the server didn't
      // apply a write, and /mark, /log and /reward aren't deduplicated server-side. Among those, retry network
      // failures (no response, including timeouts) and 5xx; fail immediately on 4xx, since resending won't fix it.
      const statusCode: number | undefined = error?.response?.status;
      const isRetryable =
        options.retryable === true &&
        (statusCode === undefined || statusCode >= 500) &&
        !this.skipRetryOnStatusCodes.includes(statusCode);

      if (isRetryable && retries > 0) {
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

      throw new Error(JSON.stringify(error));
    }
  }
}
