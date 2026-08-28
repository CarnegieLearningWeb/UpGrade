import { segmentsReducer, initialState } from './segments.reducer';
import * as SegmentsActions from './segments.actions';
import { Segment } from './segments.model';
import { SEGMENT_STATUS, SEGMENT_TYPE } from 'upgrade_types';
import { PAGE_ERROR_TYPE } from '@shared-component-lib/common-page-error/common-page-error.model';

describe('SegmentsReducer', () => {
  describe('actions to kick off requests w/ isLoadingSegments ', () => {
    const testActions = {
      actionUpsertSegment: SegmentsActions.actionUpsertSegment,
      actionGetSegmentById: SegmentsActions.actionGetSegmentById,
    };

    for (const actionKey in testActions) {
      const previousState = { ...initialState };
      previousState.isLoadingSegments = false;

      const newState = segmentsReducer(previousState, testActions[actionKey]);

      it(`on ${actionKey} reducer should return a state with isLoadingSegments: true`, () => {
        expect(newState.isLoadingSegments).toEqual(true);
      });
    }
  });

  describe('actionGetSegmentByIdFailure', () => {
    it('should set isLoadingSegments to false and set the details page error', () => {
      const previousState = { ...initialState };
      previousState.isLoadingSegments = true;
      const testAction = SegmentsActions.actionGetSegmentByIdFailure({
        segmentId: 'abc123',
        errorType: PAGE_ERROR_TYPE.NOT_FOUND,
      });

      const newState = segmentsReducer(previousState, testAction);

      expect(newState.isLoadingSegments).toEqual(false);
      expect(newState.detailsPageError).toEqual({ entityId: 'abc123', errorType: PAGE_ERROR_TYPE.NOT_FOUND });
    });
  });

  describe('actionGetSegmentById', () => {
    it('should clear the details page error', () => {
      const previousState = { ...initialState };
      previousState.detailsPageError = { entityId: 'abc123', errorType: PAGE_ERROR_TYPE.NOT_FOUND };
      const testAction = SegmentsActions.actionGetSegmentById({ segmentId: 'abc123' });

      const newState = segmentsReducer(previousState, testAction);

      expect(newState.detailsPageError).toBeNull();
    });
  });

  describe('actions to request failures to set isloadingSegments to false', () => {
    const testActions = {
      actionFetchSegmentsFailure: SegmentsActions.actionFetchSegmentsFailure,
      actionUpsertSegmentFailure: SegmentsActions.actionUpsertSegmentFailure,
    };

    for (const actionKey in testActions) {
      const previousState = { ...initialState };
      previousState.isLoadingSegments = true;

      const newState = segmentsReducer(previousState, testActions[actionKey]);

      it(`on ${actionKey} reducer should return a state with isLoadingSegments: true`, () => {
        expect(newState.isLoadingSegments).toEqual(false);
      });
    }
  });

  describe('actionUpsertSegmentSuccess', () => {
    it('should set segment and set isLoadingSegments to false', () => {
      const previousState = { ...initialState };
      previousState.segments = [];
      previousState.isLoadingSegments = true;
      const mockSegment: Segment = {
        createdAt: 'test',
        versionNumber: 0,
        updatedAt: 'test',
        id: 'abc123',
        name: 'abc',
        context: 'test',
        tags: [],
        description: 'test',
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
        type: SEGMENT_TYPE.GLOBAL_EXCLUDE,
        status: SEGMENT_STATUS.UNUSED,
      };

      const testAction = SegmentsActions.actionUpsertSegmentSuccess({
        segment: mockSegment,
      });

      const newState = segmentsReducer(previousState, testAction);

      expect(newState.isLoadingSegments).toEqual(false);
    });
  });

  describe('actionGetSegmentByIdSuccess', () => {
    it('should set segment and set isLoadingSegments to false', () => {
      const previousState = { ...initialState };
      previousState.segments = [];
      previousState.isLoadingSegments = true;
      const mockSegment: Segment = {
        createdAt: 'test',
        versionNumber: 0,
        updatedAt: 'test',
        id: 'abc123',
        name: 'abc',
        context: 'test',
        tags: [],
        description: 'test',
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
        type: SEGMENT_TYPE.PUBLIC,
        status: SEGMENT_STATUS.UNUSED,
      };

      const testAction = SegmentsActions.actionGetSegmentByIdSuccess({
        segment: mockSegment,
        experimentSegmentExclusion: [],
        experimentSegmentInclusion: [],
        featureFlagSegmentExclusion: [],
        featureFlagSegmentInclusion: [],
        allParentSegments: [],
      });

      const newState = segmentsReducer(previousState, testAction);

      expect(newState.isLoadingSegments).toEqual(false);
    });
  });

  describe('actionDeleteSegmentSuccess', () => {
    it('should remove segment from enitities and set isLoadingSegments to false', () => {
      const previousState = { ...initialState };
      const mockSegment: Segment = {
        createdAt: 'test',
        versionNumber: 0,
        updatedAt: 'test',
        id: 'abc123',
        name: 'abc',
        context: 'test',
        tags: [],
        description: 'test',
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
        type: SEGMENT_TYPE.GLOBAL_EXCLUDE,
        status: SEGMENT_STATUS.UNUSED,
      };
      previousState.segments = [mockSegment];

      const testAction = SegmentsActions.actionDeleteSegmentSuccess({
        segment: mockSegment,
      });

      const newState = segmentsReducer(previousState, testAction);

      expect(newState.segments).toEqual([]);
      expect(newState.isLoadingSegments).toEqual(false);
    });
  });

  describe('actionSetIsLoadingSegments', () => {
    it('should set boolean for isLoadingSegments', () => {
      const previousState = { ...initialState };
      previousState.isLoadingSegments = false;

      const testAction = SegmentsActions.actionSetIsLoadingSegments({
        isLoadingSegments: true,
      });

      const newState = segmentsReducer(previousState, testAction);

      expect(newState.isLoadingSegments).toEqual(true);
    });
  });
});
