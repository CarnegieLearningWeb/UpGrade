import { segmentsReducer, initialState } from './segments.reducer';
import * as SegmentsActions from './segments.actions';
import { Segment } from './segments.model';
import { SEGMENT_TYPE } from 'upgrade_types';

describe('SegmentsReducer', () => {
  describe('actions to kick off requests w/ isLoadingSegments ', () => {
    const testActions = {
      actionUpsertSegment: SegmentsActions.actionUpsertSegment,
      actionGetSegmentById: SegmentsActions.actionGetSegmentById,
      actionImportSegments: SegmentsActions.actionImportSegments,
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

  describe('actionFetchSegmentsSuccess', () => {
    it('should set allExperimentSegments values', () => {
      const previousState = { ...initialState };
      previousState.allExperimentSegmentsInclusion = null;
      previousState.allExperimentSegmentsExclusion = null;

      const testAction = SegmentsActions.actionFetchSegmentsSuccess({
        segments: [],
        experimentSegmentExclusion: [],
        experimentSegmentInclusion: [],
      });

      const newState = segmentsReducer(previousState, testAction);

      expect(newState.allExperimentSegmentsExclusion).toEqual([]);
      expect(newState.allExperimentSegmentsInclusion).toEqual([]);
    });
  });

  describe('actions to request failures to set isloadingSegments to false', () => {
    const testActions = {
      actionFetchSegmentsFailure: SegmentsActions.actionFetchSegmentsFailure,
      actionUpsertSegmentFailure: SegmentsActions.actionUpsertSegmentFailure,
      actionGetSegmentByIdFailure: SegmentsActions.actionGetSegmentByIdFailure,
      actionImportSegmentFailure: SegmentsActions.actionImportSegmentFailure,
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
      previousState.entities = {};
      previousState.isLoadingSegments = true;
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

      const testAction = SegmentsActions.actionUpsertSegmentSuccess({
        segment: mockSegment,
      });

      const newState = segmentsReducer(previousState, testAction);

      expect(newState.entities[mockSegment.id]).toEqual(mockSegment);
      expect(newState.isLoadingSegments).toEqual(false);
    });
  });

  describe('actionImportSegmentSuccess', () => {
    it('should set segments and set isLoadingSegments to false', () => {
      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoadingSegments = true;
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

      const testAction = SegmentsActions.actionImportSegmentSuccess({
        segments: [mockSegment],
      });

      const newState = segmentsReducer(previousState, testAction);

      expect(newState.entities[mockSegment.id]).toEqual(mockSegment);
      expect(newState.isLoadingSegments).toEqual(false);
    });
  });

  describe('actionGetSegmentByIdSuccess', () => {
    it('should set segment and set isLoadingSegments to false', () => {
      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoadingSegments = true;
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

      const testAction = SegmentsActions.actionGetSegmentByIdSuccess({
        segment: mockSegment,
      });

      const newState = segmentsReducer(previousState, testAction);

      expect(newState.entities[mockSegment.id]).toEqual(mockSegment);
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
        description: 'test',
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
        type: SEGMENT_TYPE.GLOBAL_EXCLUDE,
        status: 'test',
      };
      previousState.entities = {
        [mockSegment.id]: mockSegment,
      };

      const testAction = SegmentsActions.actionDeleteSegmentSuccess({
        segment: mockSegment,
      });

      const newState = segmentsReducer(previousState, testAction);

      expect(newState.entities[mockSegment.id]).toBeUndefined();
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
