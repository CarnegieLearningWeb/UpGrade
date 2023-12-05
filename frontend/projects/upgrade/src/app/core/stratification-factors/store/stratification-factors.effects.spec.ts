import { fakeAsync, tick } from '@angular/core/testing';
import { ActionsSubject } from '@ngrx/store';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { StratificationFactorsEffects } from './stratification-factors.effects';
import * as StratificationFactorsActions from './stratification-factors.actions';
import { selectAllStratificationFactors } from './stratification-factors.selectors';
import { StratificationFactor } from './stratification-factors.model';

describe('StratificationFactorsEffects', () => {
  let actions$: ActionsSubject;
  let store$: any;
  let stratificationFactorsDataService: any;
  let router: any;
  let translate: any;
  let notificationService: any;
  let service: StratificationFactorsEffects;
  const mockData: StratificationFactor = {
    factor: 'favourite_food',
    factorValue: { pizza: 10, burger: 5 },
    experimentIds: [],
  };

  beforeEach(() => {
    actions$ = new ActionsSubject();
    store$ = new BehaviorSubject({});
    store$.dispatch = jest.fn();
    stratificationFactorsDataService = {};
    router = {
      navigate: jest.fn(),
    };

    service = new StratificationFactorsEffects(
      actions$,
      router,
      store$,
      translate,
      notificationService,
      stratificationFactorsDataService
    );
  });

  describe('fetchStratificationFactors$', () => {
    it('should dispatch actionFetchStratificationFactorsSuccess on API call success', fakeAsync(() => {
      stratificationFactorsDataService.fetchStratificationFactors = jest.fn().mockReturnValue(of([mockData]));
      selectAllStratificationFactors.setResult([mockData]);

      const expectedAction = StratificationFactorsActions.actionFetchStratificationFactorsSuccess({
        stratificationFactors: [mockData],
      });

      service.fetchStratificationFactors$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(StratificationFactorsActions.actionFetchStratificationFactors({ isLoading: true }));

      tick(0);
    }));

    it('should dispatch actionFetchStratificationFactorsFailure on API call failure', fakeAsync(() => {
      stratificationFactorsDataService.fetchStratificationFactors = jest
        .fn()
        .mockReturnValue(throwError(() => new Error('test')));
      const expectedAction = StratificationFactorsActions.actionFetchStratificationFactorsFailure();

      service.fetchStratificationFactors$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(StratificationFactorsActions.actionFetchStratificationFactors({ isLoading: true }));

      tick(0);
    }));
  });

  describe('deleteStratificationFactor$', () => {
    it('should dispatch actionDeleteStratificationFactorSuccess and navigate to participants page on success', fakeAsync(() => {
      stratificationFactorsDataService.deleteStratificationFactor = jest.fn().mockReturnValue(of([{ ...mockData }]));

      const expectedAction = StratificationFactorsActions.actionDeleteStratificationFactorSuccess({
        stratificationFactor: { ...mockData },
      });

      service.deleteStratificationFactor$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
        expect(router.navigate).toHaveBeenCalledWith(['/participants']);
      });

      actions$.next(StratificationFactorsActions.actionDeleteStratificationFactor({ factor: mockData.factor }));

      tick(0);
    }));

    it('should dispatch actionDeleteStratificationFactorFailure on API call failure', fakeAsync(() => {
      stratificationFactorsDataService.deleteStratificationFactor = jest
        .fn()
        .mockReturnValue(throwError(() => new Error('test')));

      const expectedAction = StratificationFactorsActions.actionDeleteStratificationFactorFailure();

      service.deleteStratificationFactor$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
        expect(router.navigate).not.toHaveBeenCalledWith(['/participants']);
      });

      actions$.next(StratificationFactorsActions.actionDeleteStratificationFactor({ factor: mockData.factor }));

      tick(0);
    }));
  });

  describe('importStratificationFactor$', () => {
    it('should dispatch actionImportStratificationFactorSuccess on success', fakeAsync(() => {
      const mockCSVData = [{ file: 'data,test' }];
      stratificationFactorsDataService.importStratificationFactors = jest.fn().mockReturnValue(of(null));

      const expectedAction = StratificationFactorsActions.actionImportStratificationFactorSuccess();

      service.importStratificationFactor$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(StratificationFactorsActions.actionImportStratificationFactor({ csvData: mockCSVData }));

      tick(0);
    }));

    it('should dispatch actionImportStratificationFactorFailure on API call failure', fakeAsync(() => {
      const mockCSVData = [{ file: 'data,test' }];
      stratificationFactorsDataService.importStratificationFactors = jest
        .fn()
        .mockReturnValue(throwError(() => new Error('test')));

      const expectedAction = StratificationFactorsActions.actionImportStratificationFactorFailure();

      service.importStratificationFactor$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(StratificationFactorsActions.actionImportStratificationFactor({ csvData: mockCSVData }));

      tick(0);
    }));
  });

  describe('exportStratificationFactor$', () => {
    it('should dispatch actionExportStratificationFactorSuccess on success', fakeAsync(() => {
      const mockCSVFactor = 'uuid,factor1\nstudent1,1\nstudent2,0';
      stratificationFactorsDataService.exportStratificationFactor = jest.fn().mockReturnValue(of(mockCSVFactor));
      document.body.removeChild = jest.fn();

      const expectedAction = StratificationFactorsActions.actionExportStratificationFactorSuccess();
      service.exportStratificationFactor$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(StratificationFactorsActions.actionExportStratificationFactor({ factor: mockCSVFactor }));

      tick(0);
    }));

    it('should dispatch actionExportStratificationFactorFailure on API call failure', fakeAsync(() => {
      const mockFactor = 'favourite_food';
      stratificationFactorsDataService.exportStratificationFactor = jest
        .fn()
        .mockReturnValue(throwError(() => new Error('test')));

      const expectedAction = StratificationFactorsActions.actionExportStratificationFactorFailure();

      service.exportStratificationFactor$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(StratificationFactorsActions.actionExportStratificationFactor({ factor: mockFactor }));

      tick(0);
    }));
  });
});
