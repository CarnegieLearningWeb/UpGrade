import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest} from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private notificationsService: NotificationService
  ) { }

  timeOut = 1500;
  networkErrorCount: number = 0;

  incrementErrorCount() {
      return ++this.networkErrorCount;
  }
  
  openSnackBar(error) {
    let displayMessage = 'Network call failed for "' + error.url + '".';

    if (!environment.production) {
      displayMessage += ' See console for details.';
    }
    if (!((error as any).status === 401) && !environment.production) {
      setTimeout(() => {
        this.notificationsService.error(displayMessage);
      }, this.networkErrorCount * (this.timeOut+500));
    }
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError( err => {
        if (err.status === 401) {
          // auto logout if 401 response returned from api
          this.authService.authLogout();
        }  
        this.openSnackBar(err);
        this.incrementErrorCount();
        return EMPTY;
      }))
  }
}
