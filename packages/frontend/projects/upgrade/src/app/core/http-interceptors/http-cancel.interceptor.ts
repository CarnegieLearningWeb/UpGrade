// managehttp.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Router, ActivationEnd } from '@angular/router';
import { takeUntil } from 'rxjs/operators';

/**
 * This interceptor will add a rxjs takeuntil 'listener' to any outgoing http request.
 *
 * The effect will be to cancel the requestion on navigation.
 *
 * The rxjs observable pipe will work like this:
 *
 * WHEN an Http request goes out, this intercept function will fire,
 * IF 'ActivationEnd' event ever emitted from router (meaning user has successfully navigated away from page):
 * THEN make 'pendingHTTPRequests$' observable emit an event (no value even matters)
 *
 * The 'takeUntil' rxjs operator will 'complete' the HTTPRequest observable when this observable emits any event.
 * This will cancel the request.
 */

@Injectable()
export class HttpCancelInterceptor implements HttpInterceptor {
  private pendingHTTPRequests$ = new Subject<void>();

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof ActivationEnd) {
        this.cancelPendingRequests();
      }
    });
  }

  intercept<T>(req: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
    return next.handle(req).pipe(takeUntil(this.onCancelPendingRequests()));
  }

  cancelPendingRequests() {
    this.pendingHTTPRequests$.next();
  }

  onCancelPendingRequests() {
    return this.pendingHTTPRequests$.asObservable();
  }
}
