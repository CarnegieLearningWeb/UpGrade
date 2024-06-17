import { FEATURE_FLAG_STATUS, FILTER_MODE, SEGMENT_TYPE } from 'upgrade_types';

export const featureFlag = {
  id: '110c0200-7a15-4e19-8688-f9ac283f18aa',
  name: 'FF test 1',
  key: 'FF-TEST',
  description: '',
  status: FEATURE_FLAG_STATUS.ENABLED,
  context: ['home'],
  tags: [],
  filterMode: FILTER_MODE.INCLUDE_ALL,
  featureFlagSegmentInclusion: {
    segment: {
      id: '2b0c0200-7a15-4e19-8688-f9ac283f18aa',
      name: 'Feature Flag 1 Inclusion Segment',
      description: 'Feature Flag 1 Inclusion Segment',
      context: 'home',
      type: SEGMENT_TYPE.PRIVATE,
      individualForSegment: [{ userId: 'student1' }],
      groupForSegment: [{ type: 'teacher', groupId: '1' }],
      subSegments: [],
    },
  },
  featureFlagSegmentExclusion: {
    segment: {
      id: '3b0c0200-7a15-4e19-8688-f9ac283f18aa',
      name: 'Feature Flag 1 Exclusion Segment',
      description: 'Feature Flag 1 Exclusion Segment',
      context: 'home',
      type: SEGMENT_TYPE.PRIVATE,
      individualForSegment: [{ userId: 'student3' }],
      groupForSegment: [],
      subSegments: [],
    },
  },
};
