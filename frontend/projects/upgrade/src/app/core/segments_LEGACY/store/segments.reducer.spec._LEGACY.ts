import { segmentsReducer_LEGACY, initialState } from './segments.reducer._LEGACY';
import * as SegmentsActions from './segments.actions._LEGACY';
import { Segment_LEGACY } from './segments.model._LEGACY';
import { SEGMENT_TYPE } from 'upgrade_types';

describe('SegmentsReducer_LEGACY', () => {
  describe('actions to kick off requests w/ isLoadingSegments ', () => {
    const testActions = {
      actionUpsertSegment: SegmentsActions.actionUpsertSegment_LEGACY,
      actionGetSegmentById: SegmentsActions.actionGetSegmentById_LEGACY,
    };

    for (const actionKey in testActions) {
      const previousState = { ...initialState };
      previousState.isLoadingSegments = false;

      const newState = segmentsReducer_LEGACY(previousState, testActions[actionKey]);

      it(`on ${actionKey} reducer should return a state with isLoadingSegments: true`, () => {
        expect(newState.isLoadingSegments).toEqual(true);
      });
    }
  });

  describe('actionFetchSegmentsSuccess_LEGACY', () => {
    it('should set allExperimentSegments values', () => {
      const previousState = { ...initialState };
      previousState.allExperimentSegmentsInclusion = null;
      previousState.allExperimentSegmentsExclusion = null;

      const testAction = SegmentsActions.actionFetchSegmentsSuccess_LEGACY({
        segments: [],
        experimentSegmentExclusion: [],
        experimentSegmentInclusion: [],
        featureFlagSegmentExclusion: [],
        featureFlagSegmentInclusion: [],
      });

      const newState = segmentsReducer_LEGACY(previousState, testAction);

      expect(newState.allExperimentSegmentsExclusion).toEqual([]);
      expect(newState.allExperimentSegmentsInclusion).toEqual([]);
    });
  });

  describe('actions to request failures to set isloadingSegments to false', () => {
    const testActions = {
      actionFetchSegmentsFailure: SegmentsActions.actionFetchSegmentsFailure_LEGACY,
      actionUpsertSegmentFailure: SegmentsActions.actionUpsertSegmentFailure_LEGACY,
      actionGetSegmentByIdFailure: SegmentsActions.actionGetSegmentByIdFailure_LEGACY,
    };

    for (const actionKey in testActions) {
      const previousState = { ...initialState };
      previousState.isLoadingSegments = true;

      const newState = segmentsReducer_LEGACY(previousState, testActions[actionKey]);

      it(`on ${actionKey} reducer should return a state with isLoadingSegments: true`, () => {
        expect(newState.isLoadingSegments).toEqual(false);
      });
    }
  });

  describe('actionUpsertSegmentSuccess_LEGACY', () => {
    it('should set segment and set isLoadingSegments to false', () => {
      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoadingSegments = true;
      const mockSegment: Segment_LEGACY = {
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

      const testAction = SegmentsActions.actionUpsertSegmentSuccess_LEGACY({
        segment: mockSegment,
      });

      const newState = segmentsReducer_LEGACY(previousState, testAction);

      expect(newState.entities[mockSegment.id]).toEqual(mockSegment);
      expect(newState.isLoadingSegments).toEqual(false);
    });
  });

  describe('actionGetSegmentByIdSuccess_LEGACY', () => {
    it('should set segment and set isLoadingSegments to false', () => {
      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoadingSegments = true;
      const mockSegment: Segment_LEGACY = {
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

      const testAction = SegmentsActions.actionGetSegmentByIdSuccess_LEGACY({
        segment: mockSegment,
      });

      const newState = segmentsReducer_LEGACY(previousState, testAction);

      expect(newState.entities[mockSegment.id]).toEqual(mockSegment);
      expect(newState.isLoadingSegments).toEqual(false);
    });
  });

  describe('actionDeleteSegmentSuccess_LEGACY', () => {
    it('should remove segment from enitities and set isLoadingSegments to false', () => {
      const previousState = { ...initialState };
      const mockSegment: Segment_LEGACY = {
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

      const testAction = SegmentsActions.actionDeleteSegmentSuccess_LEGACY({
        segment: mockSegment,
      });

      const newState = segmentsReducer_LEGACY(previousState, testAction);

      expect(newState.entities[mockSegment.id]).toBeUndefined();
      expect(newState.isLoadingSegments).toEqual(false);
    });
  });

  describe('actionSetIsLoadingSegments_LEGACY', () => {
    it('should set boolean for isLoadingSegments', () => {
      const previousState = { ...initialState };
      previousState.isLoadingSegments = false;

      const testAction = SegmentsActions.actionSetIsLoadingSegments_LEGACY({
        isLoadingSegments: true,
      });

      const newState = segmentsReducer_LEGACY(previousState, testAction);

      expect(newState.isLoadingSegments).toEqual(true);
    });
  });
});
