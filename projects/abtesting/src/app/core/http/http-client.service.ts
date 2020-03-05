import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  private idToken: string;
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.getIdToken$.subscribe(token => {
      this.idToken = token;
    });
  }

  createAuthorizationHeader(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.idToken}`
    });
  }

  get(url: string) {
    const headers = this.createAuthorizationHeader();
    return this.http.get(url, {
      headers
    }).pipe(
      catchError(e => {
        if (e.status === 401) { this.authService.authLogout() };
        return throwError(e);
      })
    );
  }

  post(url: string, data: any) {
    const headers = this.createAuthorizationHeader();
    return this.http.post(url, data, {
      headers
    }).pipe(
      catchError(e => {
        if (e.status === 401) { this.authService.authLogout() };
        return throwError(e);
      })
    );
  }

  put(url: string, data: any) {
    const headers = this.createAuthorizationHeader();
    return this.http.put(url, data, {
      headers
    }).pipe(
      catchError(e => {
        if (e.status === 401) { this.authService.authLogout() };
        return throwError(e);
      })
    );
  }

  delete(url: string) {
    const headers = this.createAuthorizationHeader();
    return this.http.delete(url, {
      headers
    }).pipe(
      catchError(e => {
        if (e.status === 401) { this.authService.authLogout() };
        return throwError(e);
      })
    );
  }
}
