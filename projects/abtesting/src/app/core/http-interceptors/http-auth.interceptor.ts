import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class HttpAuthInterceptor implements HttpInterceptor {

  private idToken: string;
  constructor(
    private authService: AuthService
  ) {
    this.authService.getIdToken$.subscribe(token => {
      this.idToken = token;
    });
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // add authorization header with token if available
    if (this.idToken) {
      request = request.clone({
        setHeaders: {
          Authorization: `Basic ${this.idToken}`
        }
      });
    }

    return next.handle(request);
  }
}
