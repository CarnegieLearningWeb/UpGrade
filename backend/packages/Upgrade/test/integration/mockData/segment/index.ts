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
