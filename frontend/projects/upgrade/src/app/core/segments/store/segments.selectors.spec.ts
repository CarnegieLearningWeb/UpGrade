import { SEGMENT_STATUS, SEGMENT_TYPE } from 'upgrade_types';
import { Segment } from './segments.model';
import { initialState, initalGlobalState } from './segments.reducer';
import * as SegmentSelectors from './segments.selectors';

describe('SegmentSelectors', () => {
  const mockState = { ...initialState };
  const mockGlobalState = { ...initalGlobalState };
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

  describe('#selectFeatureFlagSegmentsInclusion', () => {
    it('should return any from allFeatureFlagSegmentsInclusion', () => {
      const previousState = { ...mockState };
      previousState.allFeatureFlagSegmentsInclusion = [];

      const result = SegmentSelectors.selectFeatureFlagSegmentsInclusion.projector(previousState);

      expect(result).toEqual([]);
    });
  });

  describe('#selectFeatureFlagSegmentsExclusion', () => {
    it('should return any from allFeatureFlagSegmentsExclusion', () => {
      const previousState = { ...mockState };
      previousState.allFeatureFlagSegmentsExclusion = [];

      const result = SegmentSelectors.selectFeatureFlagSegmentsExclusion.projector(previousState);

      expect(result).toEqual([]);
    });
  });

  describe('#selectSelectedSegment', () => {
    it('should return undefined from allExperimentSegmentsExclusion if segmentId is not an entity key', () => {
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
        {}
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
        tags: [],
        description: 'test',
        individualForSegment: [],
        groupForSegment: [],
        subSegments: [],
        type: SEGMENT_TYPE.GLOBAL_EXCLUDE,
        status: SEGMENT_STATUS.UNUSED,
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
        previousState.entities
      );

      expect(result).toEqual(mockSegment);
    });
  });
});
