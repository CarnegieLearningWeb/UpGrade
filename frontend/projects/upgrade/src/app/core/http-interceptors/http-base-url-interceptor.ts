import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class BaseUrlInterceptor implements HttpInterceptor {
  constructor(@Inject(ENV) private environment: Environment) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ignore httpClient requests for static assets
    if (request.url.includes('.json')) {
      return next.handle(request);
    }

    // all other requests prepend base url (apiBaseUrl)
    const apiRequest = request.clone({ url: `${this.environment.apiBaseUrl}${request.url}` });
    return next.handle(apiRequest);
  }
}
