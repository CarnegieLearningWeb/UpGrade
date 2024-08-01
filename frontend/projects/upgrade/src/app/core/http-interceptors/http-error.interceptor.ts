import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorEventBus } from '../error-event-bus/error-event-bus.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private errorEventBus: ErrorEventBus) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err) => {
        this.errorEventBus.handleError(err);

        // re-throw to allow the error to be caught by the calling code
        throw err;
      })
    );
  }
}
