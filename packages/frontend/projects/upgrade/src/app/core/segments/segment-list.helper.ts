import { normalizeStandardListType } from 'upgrade_types';
import { LIST_OPTION_TYPE, Segment } from './store/segments.model';

export interface SegmentListEditData {
  listType: string;
  formSegment?: Segment;
  values: string[];
  membersNeedFetch: boolean;
}

export function getSegmentListEditData(listType: string | null | undefined, segment: Segment): SegmentListEditData {
  const normalizedListType = normalizeStandardListType(listType);

  if (normalizedListType === LIST_OPTION_TYPE.INDIVIDUAL) {
    return {
      listType: normalizedListType,
      formSegment: segment,
      values: segment.individualForSegment?.map((individual) => individual.userId) ?? [],
      // Counts-only detail responses omit member arrays, so load members before a full-replacement edit.
      membersNeedFetch:
        !!segment.id && !segment.individualForSegment?.length && (segment.individualForSegmentCount ?? 0) > 0,
    };
  }

  if (normalizedListType === LIST_OPTION_TYPE.SEGMENT) {
    return {
      listType: normalizedListType,
      // Segment lists store a private wrapper; the form edits its referenced public segment.
      formSegment: segment.subSegments?.[0],
      values: [],
      membersNeedFetch: false,
    };
  }

  return {
    listType: normalizedListType,
    formSegment: segment,
    values: segment.groupForSegment?.map((group) => group.groupId) ?? [],
    // Counts-only detail responses omit member arrays, so load members before a full-replacement edit.
    membersNeedFetch: !!segment.id && !segment.groupForSegment?.length && (segment.groupForSegmentCount ?? 0) > 0,
  };
}
