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

export const segmentThird = {
  id: '0c66530a-b59c-4cc2-a578-6f4808be25c5',
  name: 'segment3',
  description: 'excluded group',
  context: 'home',
  type: SEGMENT_TYPE.PRIVATE,
  userIds: [],
  groups: [{ groupId: '1', type: 'teacher' }],
  subSegmentIds: [],
};

export const segmentFourth = {
  id: '0d66530a-b59c-4cc2-a578-6f4808be25c5',
  name: 'segment4',
  description: 'included users',
  context: 'home',
  type: SEGMENT_TYPE.PRIVATE,
  userId: 'student1',
  groups: [],
  subSegmentIds: [],
};

export const segmentList = {
  id: '5e05fc7a-3553-47d7-87d8-b380d389ef7c',
  name: 'segmentLiat',
  description: 'included users',
  context: 'home',
  listType: 'user',
  type: SEGMENT_TYPE.PRIVATE,
  userIds: ['student1'],
  groups: [],
  subSegmentIds: [],
  parentSegmentId: 'e0a0d838-d645-4d89-856e-89bdf6f39394',
};

export const segmentWithList = {
  id: 'e0a0d838-d645-4d89-856e-89bdf6f39394',
  name: 'segmentWithList',
  description: 'segment with list description',
  context: 'home',
  type: SEGMENT_TYPE.PUBLIC,
  userIds: [],
  groups: [],
  subSegmentIds: [],
};
