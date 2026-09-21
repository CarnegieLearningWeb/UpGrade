// managehttp.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpContextToken } from '@angular/common/http';
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
 * IF 'ActivationEnd' event ever emitted from router:
 * THEN make 'pendingHTTPRequests$' observable emit an event (no value even matters)
 *
 * The 'takeUntil' rxjs operator will 'complete' the HTTPRequest observable when this observable emits any event.
 * This will cancel the request.
 *
 * NOTE: 'ActivationEnd' fires for ANY completed navigation, not just ones a user directly triggered
 * (e.g. clicking a link). Programmatic navigations dispatched from effects (like
 * `navigateOnDeleteExperiment$` calling `router.navigate(...)`) fire it too, and will cancel any
 * request still pending at that moment - including ones kicked off by the very same effect chain.
 *
 * Requests that represent app-wide background sync (rather than data for the page that issued them)
 * can opt out of this behavior by setting the SKIP_NAVIGATION_CANCEL context token to true, so they
 * complete even if a navigation (user- or effect-triggered) happens before the response arrives.
 */

export const SKIP_NAVIGATION_CANCEL = new HttpContextToken<boolean>(() => false);

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
    if (req.context.get(SKIP_NAVIGATION_CANCEL)) {
      return next.handle(req);
    }
    return next.handle(req).pipe(takeUntil(this.onCancelPendingRequests()));
  }

  cancelPendingRequests() {
    this.pendingHTTPRequests$.next();
  }

  onCancelPendingRequests() {
    return this.pendingHTTPRequests$.asObservable();
  }
}
