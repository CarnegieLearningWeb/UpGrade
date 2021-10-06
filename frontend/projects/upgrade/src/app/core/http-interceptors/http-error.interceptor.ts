import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest} from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { NotificationsService, NotificationType } from 'angular2-notifications';
import { environment } from '../../../environments/environment';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private _notifications: NotificationsService
  ) { }

  openPopup(error) {
    const temp = {
      type: NotificationType.Error,
      title: 'Network call failed.',
      content: error.url,
      animate: 'fromRight'
    };
    if (!environment.production) {
      temp.title += ' See console for details.';
    }
    if (!((error as any).status === 401) && !environment.production) {
    this._notifications.create(temp.title, temp.content, temp.type, temp);
    }
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError( err => {
        if (err.status === 401) {
          // auto logout if 401 response returned from api
          this.authService.authLogout();
        }
        this.openPopup(err);
        return EMPTY; // returning EMPTY instead of throwError as Error is handled using snacker here itself
      }))
  }
}
