import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const ENDPOINTS_TO_INTERCEPT_FOR_MODAL_CLOSE = ['/flags/inclusionList', '/flags/exclusionList'];

@Injectable()
export class CloseModalInterceptor implements HttpInterceptor {
  constructor(private dialog: MatDialog) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          const shouldCloseModal = ENDPOINTS_TO_INTERCEPT_FOR_MODAL_CLOSE.some((endpoint) =>
            event.url.includes(endpoint)
          );
          if (shouldCloseModal && event.status === 200) {
            this.dialog.closeAll();
          }
        }
      })
    );
  }
}
