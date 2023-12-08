import { fakeAsync, tick } from '@angular/core/testing';
import { ActionsSubject } from '@ngrx/store';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { SEGMENT_TYPE } from 'upgrade_types';
import { SegmentsEffects } from './segments.effects';
import { Segment, SegmentInput, UpsertSegmentType } from './segments.model';
import { selectAllSegments } from './segments.selectors';
import * as SegmentsActions from './segments.actions';

describe('SegmentsEffects', () => {
  let store$: any;
  let actions$: ActionsSubject;
  let segmentsDataService: any;
  let router: any;
  let service: SegmentsEffects;
  const mockSegment: Segment = {
    createdAt: 'test',
    versionNumber: 0,
    updatedAt: 'test',
    id: 'abc123',
    name: 'abc',
    context: 'test',
    description: 'test',
    individualForSegment: [],
    groupForSegment: [],
    subSegments: [],
    type: SEGMENT_TYPE.GLOBAL_EXCLUDE,
    status: 'test',
  };
  const mockSegmentInput: SegmentInput = {
    createdAt: 'test',
    updatedAt: 'test',
    versionNumber: 0,
    id: 'abc123',
    name: 'testSegmentInput',
    context: 'testContext',
    description: '',
    userIds: [],
    groups: [{ groupId: 'xyz789', type: 'School' }],
    subSegmentIds: [],
    type: SEGMENT_TYPE.GLOBAL_EXCLUDE,
  };

  beforeEach(() => {
    actions$ = new ActionsSubject();
    store$ = new BehaviorSubject({});
    store$.dispatch = jest.fn();
    segmentsDataService = {};
    router = {
      navigate: jest.fn(),
    };

    service = new SegmentsEffects(store$, actions$, segmentsDataService, router);
  });

  describe('fetchSegments$', () => {
    it('should dispatch actionFetchSegmentsSuccess with segments data on API call success', fakeAsync(() => {
      segmentsDataService.fetchSegments = jest.fn().mockReturnValue(
        of({
          segmentsData: [{ ...mockSegment }],
          experimentSegmentInclusionData: [],
          experimentSegmentExclusionData: [],
        })
      );
      selectAllSegments.setResult([{ ...mockSegment }]);

      const expectedAction = SegmentsActions.actionFetchSegmentsSuccess({
        segments: [{ ...mockSegment }],
        experimentSegmentInclusion: [],
        experimentSegmentExclusion: [],
      });

      service.fetchSegments$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(SegmentsActions.actionFetchSegments({}));

      tick(0);
    }));

    it('should dispatch actionFetchSegmentsFailure on API call failure', fakeAsync(() => {
      segmentsDataService.fetchSegments = jest.fn().mockReturnValue(throwError(() => new Error('test')));
      selectAllSegments.setResult([{ ...mockSegment }]);

      const expectedAction = SegmentsActions.actionFetchSegmentsFailure();

      service.fetchSegments$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(SegmentsActions.actionFetchSegments({}));

      tick(0);
    }));
  });

  describe('upsertSegment$', () => {
    it('should do nothing if Segment is falsey', fakeAsync(() => {
      let neverEmitted = true;

      service.upsertSegment$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(
        SegmentsActions.actionUpsertSegment({
          segment: undefined,
          actionType: UpsertSegmentType.CREATE_NEW_SEGMENT,
        })
      );

      tick(0);

      expect(neverEmitted).toEqual(true);
    }));

    it('should call createNewSegment(), router nav away to segments page if CREATE_NEW_SEGMENT and actionUpsertSegmentSuccess', fakeAsync(() => {
      segmentsDataService.createNewSegment = jest.fn().mockReturnValue(of({ ...mockSegment }));

      const expectedAction = SegmentsActions.actionUpsertSegmentSuccess({
        segment: { ...mockSegment },
      });

      service.upsertSegment$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
        expect(segmentsDataService.createNewSegment).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/segments']);
      });

      actions$.next(
        SegmentsActions.actionUpsertSegment({
          segment: { ...mockSegmentInput },
          actionType: UpsertSegmentType.CREATE_NEW_SEGMENT,
        })
      );

      tick(0);
    }));

    it('should call updateSegment(), no router nav, and call actionUpsertSegmentSuccess if UPDATE_SEGMENT', fakeAsync(() => {
      segmentsDataService.updateSegment = jest.fn().mockReturnValue(of({ ...mockSegment }));

      const expectedAction = SegmentsActions.actionUpsertSegmentSuccess({
        segment: { ...mockSegment },
      });

      service.upsertSegment$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
        expect(segmentsDataService.updateSegment).toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalledWith(['/segments']);
      });

      actions$.next(
        SegmentsActions.actionUpsertSegment({
          segment: { ...mockSegmentInput },
          actionType: UpsertSegmentType.UPDATE_SEGMENT,
        })
      );

      tick(0);
    }));

    it('should dispatch actionUpsertSegmentFailure on API error', fakeAsync(() => {
      segmentsDataService.updateSegment = jest.fn().mockReturnValue(throwError(() => new Error('test')));

      const expectedAction = SegmentsActions.actionUpsertSegmentFailure();

      service.upsertSegment$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
        expect(segmentsDataService.updateSegment).toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalledWith(['/segments']);
      });

      actions$.next(
        SegmentsActions.actionUpsertSegment({
          segment: { ...mockSegmentInput },
          actionType: UpsertSegmentType.UPDATE_SEGMENT,
        })
      );

      tick(0);
    }));
  });

  describe('importSegments$', () => {
    it('should do nothing if Segment is falsey', fakeAsync(() => {
      let neverEmitted = true;

      service.importSegments$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(
        SegmentsActions.actionImportSegments({
          segments: undefined,
        })
      );

      tick(0);

      expect(neverEmitted).toEqual(true);
    }));

    it('should call importSegments(), no router nav, and call actionUpsertSegmentSuccess if IMPORT_SEGMENT', fakeAsync(() => {
      segmentsDataService.importSegments = jest.fn().mockReturnValue(of([mockSegment]));

      const expectedAction = SegmentsActions.actionImportSegmentSuccess({
        segments: [mockSegment],
      });

      service.upsertSegment$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
        expect(segmentsDataService.importSegments).toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalledWith(['/segments']);
      });

      actions$.next(
        SegmentsActions.actionImportSegments({
          segments: [mockSegmentInput],
        })
      );

      tick(0);
    }));
  });

  describe('exportSegments$', () => {
    it('should do nothing if Segment is id', fakeAsync(() => {
      let neverEmitted = true;

      service.exportSegments$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(SegmentsActions.actionExportSegments({ segmentIds: undefined }));

      tick(0);

      expect(neverEmitted).toEqual(true);
    }));

    it('should dispatch actionExportSegmentSuccess on success', fakeAsync(() => {
      segmentsDataService.exportSegments = jest.fn().mockReturnValue(of([{ ...mockSegment }]));
      document.body.removeChild = jest.fn();

      const expectedAction = SegmentsActions.actionExportSegmentSuccess();

      service.exportSegments$.subscribe((result) => {
        expect(result).toEqual(expectedAction);

        // this assertion tests the last action in the private "download" method to make sure it ran
        expect(document.body.removeChild).toHaveBeenCalled();
      });

      actions$.next(SegmentsActions.actionExportSegments({ segmentIds: [{ ...mockSegment }.id] }));

      tick(0);
    }));

    it('should dispatch actionExportSegmentFailure on failure', fakeAsync(() => {
      segmentsDataService.exportSegments = jest.fn().mockReturnValue(throwError(() => new Error('test')));

      const expectedAction = SegmentsActions.actionExportSegmentFailure();

      service.exportSegments$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(SegmentsActions.actionExportSegments({ segmentIds: [{ ...mockSegment }.id] }));

      tick(0);
    }));
  });

  describe('deleteSegments$', () => {
    it('should do nothing if Segment is id', fakeAsync(() => {
      let neverEmitted = true;

      service.deleteSegment$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(SegmentsActions.actionDeleteSegment({ segmentId: undefined }));

      tick(0);

      expect(neverEmitted).toEqual(true);
    }));

    it('should dispatch actionDeleteSegmentSuccess and navigate to segments page on success', fakeAsync(() => {
      segmentsDataService.deleteSegment = jest.fn().mockReturnValue(of([{ ...mockSegment }]));

      const expectedAction = SegmentsActions.actionDeleteSegmentSuccess({
        segment: { ...mockSegment },
      });

      service.deleteSegment$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
        expect(router.navigate).toHaveBeenCalledWith(['/segments']);
      });

      actions$.next(SegmentsActions.actionDeleteSegment({ segmentId: { ...mockSegment }.id }));

      tick(0);
    }));

    it('should dispatch actionDeleteSegmentFailure on failure', fakeAsync(() => {
      segmentsDataService.deleteSegment = jest.fn().mockReturnValue(throwError(() => new Error('test')));

      const expectedAction = SegmentsActions.actionDeleteSegmentFailure();

      service.deleteSegment$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
        expect(router.navigate).not.toHaveBeenCalledWith(['/segments']);
      });

      actions$.next(SegmentsActions.actionDeleteSegment({ segmentId: { ...mockSegment }.id }));

      tick(0);
    }));
  });
});
