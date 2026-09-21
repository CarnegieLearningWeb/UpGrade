import { fakeAsync, tick } from '@angular/core/testing';
import { ActionsSubject } from '@ngrx/store';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { FeatureFlagsEffects } from './feature-flags.effects';
import * as FeatureFlagsActions from './feature-flags.actions';
import { FeatureFlag } from './feature-flags.model';
import { PAGE_ERROR_TYPE } from '@shared-component-lib/common-page-error/common-page-error.model';

describe('FeatureFlagsEffects', () => {
  let store$: any;
  let actions$: ActionsSubject;
  let featureFlagsDataService: any;
  let router: any;
  let notificationService: any;
  let translate: any;
  let commonExportHelpersService: any;
  let commonModalEvents: any;
  let service: FeatureFlagsEffects;

  beforeEach(() => {
    actions$ = new ActionsSubject();
    store$ = new BehaviorSubject({});
    store$.dispatch = jest.fn();
    featureFlagsDataService = {};
    router = {
      navigate: jest.fn(),
    };
    notificationService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    };
    translate = {
      instant: jest.fn((key) => key),
    };
    commonExportHelpersService = {};
    commonModalEvents = {
      forceCloseModal: jest.fn(),
    };

    service = new FeatureFlagsEffects(
      store$,
      actions$,
      featureFlagsDataService,
      router,
      notificationService,
      translate,
      commonExportHelpersService,
      commonModalEvents
    );
  });

  describe('#fetchFeatureFlagById$', () => {
    // Must be a canonical (lowercase) UUID - the effect short-circuits non-canonical ids to a not-found failure
    const featureFlagId = '11111111-2222-4333-8444-555555555555';
    const flag = { id: featureFlagId, name: 'test flag' } as FeatureFlag;

    it('should dispatch success when the flag is returned', fakeAsync(() => {
      featureFlagsDataService.fetchFeatureFlagById = jest.fn().mockReturnValue(of(flag));
      let result: any;
      service.fetchFeatureFlagById$.subscribe((action: any) => (result = action));

      actions$.next(FeatureFlagsActions.actionFetchFeatureFlagById({ featureFlagId }));
      tick(0);

      expect(result).toEqual(FeatureFlagsActions.actionFetchFeatureFlagByIdSuccess({ flag }));
    }));

    it('should dispatch a not-found failure when the fetch fails with 404', fakeAsync(() => {
      featureFlagsDataService.fetchFeatureFlagById = jest.fn().mockReturnValue(throwError(() => ({ status: 404 })));
      let result: any;
      service.fetchFeatureFlagById$.subscribe((action: any) => (result = action));

      actions$.next(FeatureFlagsActions.actionFetchFeatureFlagById({ featureFlagId }));
      tick(0);

      expect(result).toEqual(
        FeatureFlagsActions.actionFetchFeatureFlagByIdFailure({ featureFlagId, errorType: PAGE_ERROR_TYPE.NOT_FOUND })
      );
    }));

    it('should dispatch a load-failed failure when the fetch fails with an unexpected error', fakeAsync(() => {
      featureFlagsDataService.fetchFeatureFlagById = jest.fn().mockReturnValue(throwError(() => ({ status: 500 })));
      let result: any;
      service.fetchFeatureFlagById$.subscribe((action: any) => (result = action));

      actions$.next(FeatureFlagsActions.actionFetchFeatureFlagById({ featureFlagId }));
      tick(0);

      expect(result).toEqual(
        FeatureFlagsActions.actionFetchFeatureFlagByIdFailure({ featureFlagId, errorType: PAGE_ERROR_TYPE.LOAD_FAILED })
      );
    }));

    it('should dispatch a not-found failure without calling the API when the id is not a canonical UUID', fakeAsync(() => {
      featureFlagsDataService.fetchFeatureFlagById = jest.fn();
      let result: any;
      service.fetchFeatureFlagById$.subscribe((action: any) => (result = action));

      actions$.next(FeatureFlagsActions.actionFetchFeatureFlagById({ featureFlagId: 'not-a-uuid' }));
      tick(0);

      expect(result).toEqual(
        FeatureFlagsActions.actionFetchFeatureFlagByIdFailure({
          featureFlagId: 'not-a-uuid',
          errorType: PAGE_ERROR_TYPE.NOT_FOUND,
        })
      );
      expect(featureFlagsDataService.fetchFeatureFlagById).not.toHaveBeenCalled();
    }));
  });
});
