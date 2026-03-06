import { ActionsSubject } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { AnalysisEffects } from './analysis.effects';
import * as AnalysisActions from './analysis.actions';
import { of, throwError } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';
import { selectQueryResult } from './analysis.selectors';

describe('AnalysisEffects', () => {
  let service: AnalysisEffects;
  let actions$: ActionsSubject;
  let store$: any;
  let analysisDataService: any;

  beforeEach(() => {
    actions$ = new ActionsSubject();
    store$ = new BehaviorSubject({});
    store$.dispatch = jest.fn();
    analysisDataService = {};

    service = new AnalysisEffects(actions$, store$, analysisDataService);
  });

  describe('fetchMetrics$', () => {
    it('should dispatch actionFetchMetricsSuccess with metrics on success', fakeAsync(() => {
      const metrics = [
        {
          key: 'totalTimeSeconds',
          children: [],
        },
      ];

      analysisDataService.fetchMetrics = jest.fn().mockReturnValue(of(metrics));

      const action = AnalysisActions.actionFetchMetricsSuccess({ metrics });

      service.fetchMetrics$.subscribe((result: any) => {
        expect(result).toEqual(action);
      });

      actions$.next(AnalysisActions.actionFetchMetrics());
      tick(0);
    }));

    it('should dispatch actionFetchMetricsFailure on error', fakeAsync(() => {
      analysisDataService.fetchMetrics = jest.fn().mockReturnValue(throwError(() => new Error('test')));

      const action = AnalysisActions.actionFetchMetricsFailure();

      service.fetchMetrics$.subscribe((result: any) => {
        expect(result).toEqual(action);
      });

      actions$.next(AnalysisActions.actionFetchMetrics());
      tick(0);
    }));
  });

  describe('upsertMetrics$', () => {
    it('should do nothing if metrics undefined', fakeAsync(() => {
      let neverEmitted = true;

      service.upsertMetrics$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(AnalysisActions.actionUpsertMetrics({ metrics: undefined }));
      tick(0);

      expect(neverEmitted).toBe(true);
    }));

    it('should dispatch actionFetchMetrics with metrics on success', fakeAsync(() => {
      const metrics = {
        metricUnit: [
          {
            key: 'totalTimeSeconds',
            children: [],
          },
        ],
      };

      analysisDataService.upsertMetrics = jest.fn().mockReturnValue(of(metrics));

      const action = AnalysisActions.actionFetchMetrics();

      service.upsertMetrics$.subscribe((result: any) => {
        expect(result).toEqual(action);
      });

      actions$.next(AnalysisActions.actionUpsertMetrics({ metrics }));
      tick(0);
    }));

    it('should dispatch actionUpsertMetricsFailure on error', fakeAsync(() => {
      const metrics = {
        metricUnit: [
          {
            key: 'totalTimeSeconds',
            children: [],
          },
        ],
      };

      analysisDataService.upsertMetrics = jest.fn().mockReturnValue(throwError(() => new Error('test')));

      const action = AnalysisActions.actionUpsertMetricsFailure();

      service.upsertMetrics$.subscribe((result: any) => {
        expect(result).toEqual(action);
      });

      actions$.next(AnalysisActions.actionUpsertMetrics({ metrics }));
      tick(0);
    }));
  });

  describe('deleteMetrics$', () => {
    it('should do nothing if key undefined', fakeAsync(() => {
      let neverEmitted = true;

      service.deleteMetrics$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(AnalysisActions.actionDeleteMetric({ key: undefined }));
      tick(0);

      expect(neverEmitted).toBe(true);
    }));

    it('should dispatch actionDeleteMetricSuccess with metrics on success with data of truthy size', fakeAsync(() => {
      const key = 'test';
      const metrics = [
        {
          key: 'totalTimeSeconds',
          children: [],
        },
      ];

      analysisDataService.deleteMetric = jest.fn().mockReturnValue(of(metrics));

      const action = AnalysisActions.actionDeleteMetricSuccess({ metrics });

      service.deleteMetrics$.subscribe((result: any) => {
        expect(result).toEqual(action);
      });

      actions$.next(AnalysisActions.actionDeleteMetric({ key }));
      tick(0);
    }));

    it('should dispatch actionDeleteMetricSuccess with metrics and key on success with data of falsey size', fakeAsync(() => {
      const key = 'test';
      const metrics = [];

      analysisDataService.deleteMetric = jest.fn().mockReturnValue(of(metrics));

      const action = AnalysisActions.actionDeleteMetricSuccess({ metrics, key });

      service.deleteMetrics$.subscribe((result: any) => {
        expect(result).toEqual(action);
      });

      actions$.next(AnalysisActions.actionDeleteMetric({ key }));
      tick(0);
    }));

    it('should dispatch actionDeleteMetricFailure on error', fakeAsync(() => {
      const key = 'test';

      analysisDataService.deleteMetric = jest.fn().mockReturnValue(throwError(() => new Error('test')));

      const action = AnalysisActions.actionDeleteMetricFailure();

      service.deleteMetrics$.subscribe((result: any) => {
        expect(result).toEqual(action);
      });

      actions$.next(AnalysisActions.actionDeleteMetric({ key }));
      tick(0);
    }));
  });

  describe('executeQuery$', () => {
    it('should do nothing if queryIds size is falsey', fakeAsync(() => {
      const queryIds = [];
      let neverEmitted = true;
      selectQueryResult.setResult({});

      service.executeQuery$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(AnalysisActions.actionExecuteQuery({ queryIds }));
      tick(0);

      expect(neverEmitted).toBe(true);
    }));

    it('should dispatch actionExecuteQuerySuccess with matching query result', fakeAsync(() => {
      const queryIds = ['abc123'];
      const previousQueryResult = [{ id: 'abc123' }];
      const currentQueryResult = [{ id: 'abc123' }];
      const mergedResult = [{ id: 'abc123' }];
      selectQueryResult.setResult(previousQueryResult);

      analysisDataService.executeQuery = jest.fn().mockReturnValue(of(currentQueryResult));

      const action = AnalysisActions.actionExecuteQuerySuccess({ queryResult: mergedResult });

      service.executeQuery$.subscribe((result: any) => {
        expect(result).toEqual(action);
      });

      actions$.next(AnalysisActions.actionExecuteQuery({ queryIds }));
      tick(0);
    }));

    it('should dispatch actionExecuteQuerySuccess with merged query result', fakeAsync(() => {
      const queryIds = ['xyz1789'];
      const previousQueryResult = [{ id: 'abc123' }];
      const currentQueryResult = [{ id: 'xyz1789' }];
      const mergedResult = [{ id: 'abc123' }, { id: 'xyz1789' }];
      selectQueryResult.setResult(previousQueryResult);

      analysisDataService.executeQuery = jest.fn().mockReturnValue(of(currentQueryResult));

      const action = AnalysisActions.actionExecuteQuerySuccess({ queryResult: mergedResult });

      service.executeQuery$.subscribe((result: any) => {
        expect(result).toEqual(action);
      });

      actions$.next(AnalysisActions.actionExecuteQuery({ queryIds }));
      tick(0);
    }));

    it('should dispatch actionExecuteQuerySuccess with current query result if stored previous result is falsey', fakeAsync(() => {
      const queryIds = ['xyz1789'];
      const previousQueryResult = null;
      const currentQueryResult = [{ id: 'xyz1789' }];
      const mergedResult = [{ id: 'xyz1789' }];
      selectQueryResult.setResult(previousQueryResult);

      analysisDataService.executeQuery = jest.fn().mockReturnValue(of(currentQueryResult));

      const action = AnalysisActions.actionExecuteQuerySuccess({ queryResult: mergedResult });

      service.executeQuery$.subscribe((result: any) => {
        expect(result).toEqual(action);
      });

      actions$.next(AnalysisActions.actionExecuteQuery({ queryIds }));
      tick(0);
    }));

    it('should dispatch actionExecuteQueryFailure if service call encounters an error', fakeAsync(() => {
      const queryIds = ['xyz1789'];
      const previousQueryResult = null;

      selectQueryResult.setResult(previousQueryResult);

      analysisDataService.executeQuery = jest.fn().mockReturnValue(throwError(() => new Error('test')));

      const action = AnalysisActions.actionExecuteQueryFailure();

      service.executeQuery$.subscribe((result: any) => {
        expect(result).toEqual(action);
      });

      actions$.next(AnalysisActions.actionExecuteQuery({ queryIds }));
      tick(0);
    }));
  });
});
