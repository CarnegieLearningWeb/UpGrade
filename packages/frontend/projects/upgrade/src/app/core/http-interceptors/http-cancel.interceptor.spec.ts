import { HttpRequest } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { ActivationEnd, ActivationStart } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpCancelInterceptor } from './http-cancel.interceptor';

class MockRouter {
  events = new Subject();
}

describe('HttpCancelInterceptor', () => {
  let mockRouter: any;
  let service: HttpCancelInterceptor;
  const mockSnapshot = {
    data: {
      title: 'test',
    },
    routeConfig: {
      data: {
        label: 'test',
      },
    },
  } as any;

  beforeEach(() => {
    mockRouter = new MockRouter();
    service = new HttpCancelInterceptor(mockRouter);
  });

  describe('#constructor', () => {
    it('should call cancelPaymentRequests when router event type ActivationEnd is emitted', () => {
      const cancelSpy = jest.spyOn(service, 'cancelPendingRequests');

      mockRouter.events.next(new ActivationEnd(mockSnapshot));

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should NOT call cancelPaymentRequests when router other event types are emitted', () => {
      service.cancelPendingRequests = jest.fn();

      mockRouter.events.next(new ActivationStart(mockSnapshot));

      expect(service.cancelPendingRequests).not.toHaveBeenCalled();
    });
  });

  describe('#intercept', () => {
    it('should complete the observable if onCancelPendingRequests is called', fakeAsync(() => {
      const next: any = {
        handle: () => new BehaviorSubject(null),
      };

      const mockRequest = new HttpRequest('GET', '/test');
      let completed = false;

      const interceptedRequestObservable = service.intercept(mockRequest, next);

      interceptedRequestObservable
        .pipe(
          finalize(() => {
            completed = true;
          })
        )
        .subscribe();

      service.cancelPendingRequests();

      tick(0);

      expect(completed).toBeTruthy();
    }));

    it('should NOT complete the observable if onCancelPendingRequests is NOT called', fakeAsync(() => {
      const next: any = {
        handle: () => new BehaviorSubject(null),
      };

      const mockRequest = new HttpRequest('GET', '/test');
      let completed = false;

      const interceptedRequestObservable = service.intercept(mockRequest, next);

      interceptedRequestObservable
        .pipe(
          finalize(() => {
            completed = true;
          })
        )
        .subscribe();

      tick(0);

      expect(completed).toBeFalsy();
    }));
  });
});
