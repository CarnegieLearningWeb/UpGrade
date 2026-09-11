import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivationEnd } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { ExperimentDataService } from '../experiments/experiments.data.service';
import { FeatureFlagsDataService } from '../feature-flags/feature-flags.data.service';
import { SegmentsDataService } from '../segments/segments.data.service';
import { HttpCancelInterceptor, SKIP_NAVIGATION_CANCEL } from '../http-interceptors/http-cancel.interceptor';
import { HttpErrorInterceptor } from '../http-interceptors/http-error.interceptor';
import { batchHttpContext } from './batch-actions.http';

describe('Batch HTTP contracts', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExperimentDataService, FeatureFlagsDataService, SegmentsDataService],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it.each([
    ['experiments', ExperimentDataService],
    ['flags', FeatureFlagsDataService],
    ['segments', SegmentsDataService],
  ] as const)('%s sends the complete selection in one read or delete request', (entity, token) => {
    const service = TestBed.inject(token as typeof ExperimentDataService);
    for (const count of [20, 100, 500]) {
      const ids = Array.from(
        { length: count },
        (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`
      );
      service.checkDeletionEligibility(ids).subscribe();
      const read = http.expectOne(`/${entity}/deletion-eligibility`);
      expect(read.request.method).toBe('POST');
      expect(read.request.body).toEqual({ ids });
      expect(read.request.context.get(SKIP_NAVIGATION_CANCEL)).toBe(true);
      read.flush({ items: [], allDeletable: false });
      service.batchDelete(ids).subscribe();
      const deletion = http.expectOne(`/${entity}/batch-delete`);
      expect(deletion.request.method).toBe('POST');
      expect(deletion.request.body).toEqual({ ids });
      expect(deletion.request.context.get(SKIP_NAVIGATION_CANCEL)).toBe(true);
      deletion.flush({ phase: 'executed', results: [] });
    }
  });

  it('continues observing a batch response through navigation', () => {
    const navigation = new Subject();
    const response = new Subject<any>();
    const interceptor = new HttpCancelInterceptor({ events: navigation } as any);
    const received = jest.fn();
    const subscription = interceptor
      .intercept(new HttpRequest('POST', '/flags/batch-delete', {}, { context: batchHttpContext() }), {
        handle: () => response,
      })
      .subscribe(received);
    navigation.next(new ActivationEnd({} as any));
    response.next({ status: 200 });
    expect(received).toHaveBeenCalledWith({ status: 200 });
    subscription.unsubscribe();
    navigation.complete();
  });

  it.each([0, 400, 403, 404, 500, 504])('reports HTTP %i using the existing error popup', (status) => {
    const notification = { create: jest.fn() };
    const auth = { authLogout: jest.fn() };
    const interceptor = new HttpErrorInterceptor(auth as any, notification as any, {} as any);
    const error = new HttpErrorResponse({ status });
    const failed = jest.fn();
    interceptor
      .intercept(new HttpRequest('POST', '/flags/batch-delete', {}, { context: batchHttpContext() }), {
        handle: () => throwError(() => error),
      })
      .subscribe({ error: failed });
    expect(notification.create).toHaveBeenCalledTimes(1);
    expect(notification.create.mock.calls[0][0]).toBe('Network call failed. See console for details.');
    expect(failed).toHaveBeenCalledWith(error);
  });

  it('preserves automatic logout for a batch 401', () => {
    const auth = { authLogout: jest.fn() };
    const interceptor = new HttpErrorInterceptor(auth as any, { create: jest.fn() } as any, {} as any);
    interceptor
      .intercept(new HttpRequest('POST', '/flags/batch-delete', {}, { context: batchHttpContext() }), {
        handle: () => throwError(() => new HttpErrorResponse({ status: 401 })),
      })
      .subscribe({ error: () => undefined });
    expect(auth.authLogout).toHaveBeenCalledTimes(1);
  });
});
