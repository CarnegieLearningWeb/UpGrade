import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class HttpAuthInterceptor implements HttpInterceptor {
  private googleCredential: string;
  constructor(private authService: AuthService) {
    this.authService.getGoogleCredential$.subscribe((googleCredential) => {
      this.googleCredential = googleCredential;
    });
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // add authorization header with token if available
    if (this.googleCredential) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${this.googleCredential}`,
        },
      });
    }

    return next.handle(request);
  }
}
