import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const ENDPOINTS_TO_INTERCEPT_FOR_MODAL_CLOSE = ['flags/inclusionList', '/flags/exclusionList'];

@Injectable()
export class CloseModalInterceptor implements HttpInterceptor {
  constructor(private dialog: MatDialog) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap((event) => {
        console.log('>> interceptor event', event);
        if (event instanceof HttpResponse) {
          // Check if the URL matches any in the ENDPOINTS_TO_INTERCEPT_FOR_MODAL_CLOSE array
          const shouldCloseModal = ENDPOINTS_TO_INTERCEPT_FOR_MODAL_CLOSE.some((endpoint) =>
            event.url.includes(endpoint)
          );
          console.log('>> shouldCloseModal', shouldCloseModal);
          if (shouldCloseModal && event.status === 200) {
            this.dialog.closeAll();
          }
        }
      })
    );
  }
}
