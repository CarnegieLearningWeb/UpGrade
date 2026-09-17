import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { ExperimentDataService } from '../experiments/experiments.data.service';
import { FeatureFlagsDataService } from '../feature-flags/feature-flags.data.service';
import { SegmentsDataService } from '../segments/segments.data.service';
import { HttpCancelInterceptor, SKIP_NAVIGATION_CANCEL } from '../http-interceptors/http-cancel.interceptor';
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
  ] as const)('%s sends the complete selection in one deletion request', (entity, token) => {
    const service = TestBed.inject(token as typeof ExperimentDataService);
    const ids = ['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'];
    service.batchDelete(ids).subscribe();
    const deletion = http.expectOne(`/${entity}/batch-delete`);
    expect(deletion.request.method).toBe('POST');
    expect(deletion.request.body).toEqual({ ids });
    expect(deletion.request.context.get(SKIP_NAVIGATION_CANCEL)).toBe(true);
    deletion.flush({ phase: 'executed', results: ids.map((id) => ({ id, outcome: 'deleted' })) });
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
});
