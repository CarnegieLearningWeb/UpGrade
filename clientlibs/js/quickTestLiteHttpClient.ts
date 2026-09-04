// A minimal IHttpClientWrapper implementation used only by quickTest.ts to smoke-test the
// "lite" build, which ships with no bundled HTTP client and requires consumers to bring their own.
// Deliberately uses the global `fetch` (Node 18+) instead of axios, so running against the lite
// build never pulls axios back in.
import type { UpGradeClientInterfaces } from './dist/node';

export class FetchHttpClient implements UpGradeClientInterfaces.IHttpClientWrapper {
  public config: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig = undefined;

  public async doGet<ResponseType>(
    url: string,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<ResponseType> {
    return this.request<ResponseType>('GET', url, undefined, options);
  }

  public async doPost<ResponseType, RequestBodyType>(
    url: string,
    body: RequestBodyType,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<ResponseType> {
    return this.request<ResponseType>('POST', url, body, options);
  }

  public async doPatch<ResponseType, RequestBodyType>(
    url: string,
    body: RequestBodyType,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<ResponseType> {
    return this.request<ResponseType>('PATCH', url, body, options);
  }

  private async request<ResponseType>(
    method: 'GET' | 'POST' | 'PATCH',
    url: string,
    body: unknown,
    options: UpGradeClientInterfaces.IHttpClientWrapperRequestConfig
  ): Promise<ResponseType> {
    const response = await fetch(url, {
      method,
      headers: options.headers as Record<string, string>,
      credentials: options.withCredentials ? 'include' : 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    // matches DefaultHttpClient's shape so the existing quickTest error logging works unchanged
    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = undefined;
    }
    if (!response.ok) {
      throw new Error(JSON.stringify({ statusCode: response.status, response: responseBody }));
    }

    return responseBody as ResponseType;
  }
}
