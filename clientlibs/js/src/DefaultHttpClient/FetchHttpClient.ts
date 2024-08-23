import { UpGradeClientInterfaces, UpGradeClientEnums } from '../types';

export class FetchHttpClient implements UpGradeClientInterfaces.IHttpClientWrapper {
  public config: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig = null;

  private convertHeaders(headers: { [key: string]: string | string[] }): HeadersInit {
    const result: HeadersInit = {};
    for (const [key, value] of Object.entries(headers)) {
      if (Array.isArray(value)) {
        result[key] = value.join(', ');
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private async fetchWithRetry<T>(url: string, options: RequestInit, retries = 3, backoff = 300): Promise<T> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return this.fetchWithRetry<T>(url, options, retries - 1, backoff * 2);
      }
      throw error;
    }
  }

  public async doGet<ResponseType>(
    url: string,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<ResponseType> {
    return this.fetchWithRetry<ResponseType>(url, {
      method: UpGradeClientEnums.REQUEST_METHOD.GET,
      headers: this.convertHeaders(options.headers),
    });
  }

  public async doPost<ResponseType, RequestBodyType>(
    url: string,
    body: RequestBodyType,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<ResponseType> {
    return this.fetchWithRetry<ResponseType>(url, {
      method: UpGradeClientEnums.REQUEST_METHOD.POST,
      headers: this.convertHeaders(options.headers),
      body: JSON.stringify(body),
    });
  }

  public async doPatch<ResponseType, RequestBodyType>(
    url: string,
    body: RequestBodyType,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<ResponseType> {
    return this.fetchWithRetry<ResponseType>(url, {
      method: UpGradeClientEnums.REQUEST_METHOD.PATCH,
      headers: this.convertHeaders(options.headers),
      body: JSON.stringify(body),
    });
  }
}