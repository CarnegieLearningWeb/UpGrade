import { SEGMENT_TYPE } from 'upgrade_types';
import { Segment_LEGACY } from './segments.model._LEGACY';
import { initialState } from './segments.reducer._LEGACY';
import * as SegmentSelectors from './segments.selectors._LEGACY';

describe('SegmentSelectors_LEGACY', () => {
  const mockState = { ...initialState };

  describe('#selectIsLoadingSegments_LEGACY', () => {
    it('should return boolean from isLoadingSegments', () => {
      const previousState = { ...mockState };
      previousState.isLoadingSegments = false;

      const result = SegmentSelectors.selectIsLoadingSegments_LEGACY.projector(previousState);

      expect(result).toEqual(false);
    });
  });

  describe('#selectExperimentSegmentsInclusion_LEGACY', () => {
    it('should return any from allExperimentSegmentsInclusion', () => {
      const previousState = { ...mockState };
      previousState.allExperimentSegmentsInclusion = [];

      const result = SegmentSelectors.selectExperimentSegmentsInclusion_LEGACY.projector(previousState);

      expect(result).toEqual([]);
    });
  });

  describe('#selectExperimentSegmentsExclusion_LEGACY', () => {
    it('should return any from allExperimentSegmentsExclusion', () => {
      const previousState = { ...mockState };
      previousState.allExperimentSegmentsExclusion = [];

      const result = SegmentSelectors.selectExperimentSegmentsExclusion_LEGACY.projector(previousState);

      expect(result).toEqual([]);
    });
  });

  describe('#selectFeatureFlagSegmentsInclusion_LEGACY', () => {
    it('should return any from allFeatureFlagSegmentsInclusion', () => {
      const previousState = { ...mockState };
      previousState.allFeatureFlagSegmentsInclusion = [];

      const result = SegmentSelectors.selectFeatureFlagSegmentsInclusion_LEGACY.projector(previousState);

      expect(result).toEqual([]);
    });
  });

  describe('#selectFeatureFlagSegmentsExclusion_LEGACY', () => {
    it('should return any from allFeatureFlagSegmentsExclusion', () => {
      const previousState = { ...mockState };
      previousState.allFeatureFlagSegmentsExclusion = [];

      const result = SegmentSelectors.selectFeatureFlagSegmentsExclusion_LEGACY.projector(previousState);

      expect(result).toEqual([]);
    });
  });

  describe('#selectSelectedSegment_LEGACY', () => {
    it('should return undefined from allExperimentSegmentsExclusion if segmentId is not an entity key', () => {
      const previousState = { ...mockState };
      previousState.entities = {};

      const result = SegmentSelectors.selectSelectedSegment_LEGACY.projector(
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
        abc123: mockSegment,
      };

      const result = SegmentSelectors.selectSelectedSegment_LEGACY.projector(
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
