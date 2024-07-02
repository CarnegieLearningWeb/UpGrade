import { SEGMENT_TYPE } from 'upgrade_types';

export const segment = {
  id: '0b66530a-b59c-4cc2-a578-6f4808be25c5',
  name: 'segment1',
  description: 'segment1 description',
  context: 'home',
  type: SEGMENT_TYPE.PUBLIC,
  userIds: ['student1', 'student2'],
  groups: [
    { groupId: '2', type: 'teacher' },
    { groupId: '2', type: 'class' },
  ],
  subSegmentIds: [],
};

export const segmentSecond = {
  id: '1b66530a-b59c-4cc2-a578-6f4808be25c5',
  name: 'segment2',
  description: 'segment2 description',
  context: 'home',
  type: SEGMENT_TYPE.PUBLIC,
  userIds: ['user1', 'user2'],
  groups: [
    { groupId: 'id1', type: 'type1' },
    { groupId: 'id2', type: 'type2' },
  ],
  subSegmentIds: ['0b66530a-b59c-4cc2-a578-6f4808be25c5'],
};

export const featureFlagSegmentInclusion = {
  id: '2b0c0200-7a15-4e19-8688-f9ac283f18aa',
  name: 'Feature Flag 1 Inclusion Segment',
  description: 'Feature Flag 1 Inclusion Segment',
  context: 'home',
  type: SEGMENT_TYPE.PRIVATE,
  userIds: ['student1'],
  groups: [{ type: 'teacher', groupId: '1' }],
  subSegmentIds: [],
  includedInFeatureFlag: '110c0200-7a15-4e19-8688-f9ac283f18aa',
};

export const featureFlagSegmentExclusion = {
  id: '3b0c0200-7a15-4e19-8688-f9ac283f18aa',
  name: 'Feature Flag 1 Exclusion Segment',
  description: 'Feature Flag 1 Exclusion Segment',
  context: 'home',
  type: SEGMENT_TYPE.PRIVATE,
  userIds: ['student3'],
  groups: [],
  subSegmentIds: [],
  excludedFromFeatureFlag: '110c0200-7a15-4e19-8688-f9ac283f18aa',
};
