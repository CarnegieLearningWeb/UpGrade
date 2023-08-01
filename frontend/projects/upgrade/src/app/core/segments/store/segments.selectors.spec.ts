import { SEGMENT_TYPE } from 'upgrade_types';
import { Segment } from './segments.model';
import { initialState } from './segments.reducer';
import * as SegmentSelectors from './segments.selectors';

describe('SegmentSelectors', () => {
  const mockState = { ...initialState };

  describe('#selectIsLoadingSegments', () => {
    it('should return boolean from isLoadingSegments', () => {
      const previousState = { ...mockState };
      previousState.isLoadingSegments = false;

      const result = SegmentSelectors.selectIsLoadingSegments.projector(previousState);

      expect(result).toEqual(false);
    });
  });

  describe('#selectExperimentSegmentsInclusion', () => {
    it('should return any from allExperimentSegmentsInclusion', () => {
      const previousState = { ...mockState };
      previousState.allExperimentSegmentsInclusion = [];

      const result = SegmentSelectors.selectExperimentSegmentsInclusion.projector(previousState);

      expect(result).toEqual([]);
    });
  });

  describe('#selectExperimentSegmentsExclusion', () => {
    it('should return any from allExperimentSegmentsExclusion', () => {
      const previousState = { ...mockState };
      previousState.allExperimentSegmentsExclusion = [];

      const result = SegmentSelectors.selectExperimentSegmentsExclusion.projector(previousState);

      expect(result).toEqual([]);
    });
  });

  describe('#selectSelectedSegment', () => {
    it('should return undefined from allExperimentSegmentsExclusion if segmentId is not an entity key', () => {
      const previousState = { ...mockState };
      previousState.entities = {};

      const result = SegmentSelectors.selectSelectedSegment.projector(
        {
          state: {
            params: {
              segmentId: 'abc123',
            },
            url: 'test',
            queryParams: {},
          },
          navigationId: 0,
        },
        previousState
      );

      expect(result).toEqual(undefined);
    });

    it('should return entity from allExperimentSegmentsExclusion by segmentId', () => {
      const previousState = { ...mockState };
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
        abc123: mockSegment,
      };

      const result = SegmentSelectors.selectSelectedSegment.projector(
        {
          state: {
            params: {
              segmentId: 'abc123',
            },
            url: 'test',
            queryParams: {},
          },
          navigationId: 0,
        },
        previousState
      );

      expect(result).toEqual(mockSegment);
    });
  });
});
