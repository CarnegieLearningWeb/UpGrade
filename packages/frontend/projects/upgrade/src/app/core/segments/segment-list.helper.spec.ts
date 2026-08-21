import { normalizeStandardListType, SEGMENT_TYPE } from 'upgrade_types';
import { getSegmentListEditData } from './segment-list.helper';
import { LIST_OPTION_TYPE, Segment } from './store/segments.model';

describe('normalizeStandardListType', () => {
  it.each([
    ['individual', LIST_OPTION_TYPE.INDIVIDUAL],
    ['InDiViDuAl', LIST_OPTION_TYPE.INDIVIDUAL],
    ['segment', LIST_OPTION_TYPE.SEGMENT],
    ['SeGmEnT', LIST_OPTION_TYPE.SEGMENT],
  ])('normalizes %s to %s', (listType, expected) => {
    expect(normalizeStandardListType(listType)).toBe(expected);
  });

  it.each([LIST_OPTION_TYPE.INDIVIDUAL, LIST_OPTION_TYPE.SEGMENT])('preserves canonical type %s', (listType) => {
    expect(normalizeStandardListType(listType)).toBe(listType);
  });

  it('preserves context-specific group types', () => {
    expect(normalizeStandardListType('schoolId')).toBe('schoolId');
  });

  it.each(['', null, undefined])('returns an empty string for %s', (listType) => {
    expect(normalizeStandardListType(listType)).toBe('');
  });
});

describe('getSegmentListEditData', () => {
  const createSegment = (overrides: Partial<Segment> = {}): Segment =>
    ({
      id: 'list-id',
      individualForSegment: [],
      groupForSegment: [],
      subSegments: [],
      type: SEGMENT_TYPE.PRIVATE,
      ...overrides,
    } as Segment);

  it('normalizes an individual list and returns its user IDs', () => {
    const segment = createSegment({
      individualForSegment: [{ userId: 'student-1', segmentId: 'list-id' }],
    });

    expect(getSegmentListEditData('individual', segment)).toEqual({
      listType: LIST_OPTION_TYPE.INDIVIDUAL,
      formSegment: segment,
      values: ['student-1'],
      membersNeedFetch: false,
    });
  });

  it('requests members for a count-only individual list', () => {
    const segment = createSegment({ individualForSegmentCount: 1 });

    expect(getSegmentListEditData('individual', segment)).toEqual({
      listType: LIST_OPTION_TYPE.INDIVIDUAL,
      formSegment: segment,
      values: [],
      membersNeedFetch: true,
    });
  });

  it('does not request individual members without a persisted segment ID', () => {
    const segment = createSegment({ id: undefined, individualForSegmentCount: 1 });

    expect(getSegmentListEditData('individual', segment).membersNeedFetch).toBe(false);
  });

  it.each([undefined, 0])('does not request individual members for count %s', (count) => {
    const segment = createSegment({ individualForSegmentCount: count });

    expect(getSegmentListEditData('individual', segment).membersNeedFetch).toBe(false);
  });

  it('normalizes a segment list without requesting members', () => {
    const publicSegment = createSegment({ id: 'public-segment-id', type: SEGMENT_TYPE.PUBLIC });
    const segment = createSegment({
      subSegments: [publicSegment],
    });

    expect(getSegmentListEditData('segment', segment)).toEqual({
      listType: LIST_OPTION_TYPE.SEGMENT,
      formSegment: publicSegment,
      values: [],
      membersNeedFetch: false,
    });
  });

  it('does not use the private wrapper when a segment list has no public segment', () => {
    const segment = createSegment();

    expect(getSegmentListEditData('segment', segment).formSegment).toBeUndefined();
  });

  it('preserves a context-specific group type and returns its group IDs', () => {
    const segment = createSegment({
      groupForSegment: [{ groupId: 'school-1', type: 'schoolId', segmentId: 'list-id' }],
    });

    expect(getSegmentListEditData('schoolId', segment)).toEqual({
      listType: 'schoolId',
      formSegment: segment,
      values: ['school-1'],
      membersNeedFetch: false,
    });
  });

  it.each([null, undefined])('does not throw when list type is %s', (listType) => {
    const segment = createSegment();

    expect(getSegmentListEditData(listType, segment)).toEqual({
      listType: '',
      formSegment: segment,
      values: [],
      membersNeedFetch: false,
    });
  });

  it('requests members for a count-only group list', () => {
    const segment = createSegment({ groupForSegmentCount: 1 });

    expect(getSegmentListEditData('schoolId', segment)).toEqual({
      listType: 'schoolId',
      formSegment: segment,
      values: [],
      membersNeedFetch: true,
    });
  });

  it('does not request group members without a persisted segment ID', () => {
    const segment = createSegment({ id: undefined, groupForSegmentCount: 1 });

    expect(getSegmentListEditData('schoolId', segment).membersNeedFetch).toBe(false);
  });

  it.each([undefined, 0])('does not request group members for count %s', (count) => {
    const segment = createSegment({ groupForSegmentCount: count });

    expect(getSegmentListEditData('schoolId', segment).membersNeedFetch).toBe(false);
  });
});
