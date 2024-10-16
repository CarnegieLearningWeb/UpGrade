import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { NotificationsService, NotificationType } from 'angular2-notifications';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ENV, Environment } from '../../../environments/environment-types';
import { AuthService } from '../auth/auth.service';
import { SERVER_ERROR } from 'upgrade_types';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private _notifications: NotificationsService,
    @Inject(ENV) private environment: Environment
  ) {}

  openPopup(error) {
    const temp = {
      type: NotificationType.Error,
      title: 'Network call failed. See console for details.',
      content: error.url,
      animate: 'fromRight',
    };
    if (error.error?.type !== SERVER_ERROR.DUPLICATE_KEY) {
      this._notifications.create(temp.title, temp.content, temp.type, temp);
    }
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err) => {
        if (err.status === 401) {
          // auto logout if 401 response returned from api
          this.authService.authLogout();
        } else {
          this.openPopup(err);
        }
        // re-throw to allow the error to be caught by the calling code
        throw err;
      })
    );
  }
}
