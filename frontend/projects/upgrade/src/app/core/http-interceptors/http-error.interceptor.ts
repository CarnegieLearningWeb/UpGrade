import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { NotificationsService, NotificationType } from 'angular2-notifications';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ENV, Environment } from '../../../environments/environment-types';
import { AuthService } from '../auth/auth.service';

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
      title: 'Network call failed.',
      content: error.url,
      animate: 'fromRight',
    };
    if (!this.environment.production) {
      temp.title += ' See console for details.';
    }
    if (!(error.status === 401) && !this.environment.production) {
      this._notifications.create(temp.title, temp.content, temp.type, temp);
    }
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err) => {
        if (err.status === 401) {
          // auto logout if 401 response returned from api
          this.authService.authLogout();
        }
        this.openPopup(err);
        return EMPTY; // returning EMPTY instead of throwError as Error is handled using snacker here itself
      })
    );
  }
}
