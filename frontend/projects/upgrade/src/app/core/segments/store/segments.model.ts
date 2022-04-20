import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';
import { SEGMENT_TYPE } from 'upgrade_types';

// TODO: Move to upgrade types
export enum SEGMENTS_SEARCH_SORT_KEY {
  ALL = 'all',
  NAME = 'name',
  STATUS = 'status',
  CONTEXT = 'context',
}

export enum SORT_AS {
  ASCENDING = 'ASC',
  DESCENDING = 'DESC'
}

export enum MemberTypes {
  INDIVIDUAL = 'Individual',
  SEGMENT = 'Segment'
}
interface ISegmentsSearchParams {
  key: SEGMENTS_SEARCH_SORT_KEY;
  string: string
}

interface ISegmentsSortParams {
  key: SEGMENTS_SEARCH_SORT_KEY;
  sortAs: SORT_AS;
}

export interface SegmentsPaginationParams {
  skip: number;
  take: number;
  searchParams?: ISegmentsSearchParams;
  sortParams?: ISegmentsSortParams;
}

export const NUMBER_OF_SEGMENTS = 20;

export enum NewSegmentDialogEvents {
  CLOSE_DIALOG = 'Close Dialog',
  SEND_FORM_DATA = 'Send Form Data',
  UPDATE_SEGMENT = 'Update segment'
}

export enum NewSegmentPaths {
  SEGMENT_OVERVIEW = 'Segment Overview',
  SEGMENT_MEMBERS = 'Segment Members',
}

// export enum VariationTypes {
//   CUSTOM = 'custom',
//   BOOLEAN = 'boolean'
// }

export enum UpsertSegmentType {
  CREATE_NEW_SEGMENT = 'Create new segment',
  UPDATE_SEGMENT = 'Update segment'
}


export interface NewSegmentDialogData {
  type: NewSegmentDialogEvents;
  formData?: any;
  path?: NewSegmentPaths;
}

export interface Group {
  groupId: string;
  type: string;
}

export interface i {
  userId: string;
}

export interface Segment {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
  name: string;
  context: string;
  description: string;
  individualForSegment: i[];
  groupForSegment: Group[];
  subSegments: string[];
  type: SEGMENT_TYPE;
}

export interface SegmentState extends EntityState<Segment> {
  isLoadingSegments: boolean;
  skipSegments: number;
  totalSegments: number;
  searchKey: SEGMENTS_SEARCH_SORT_KEY;
  searchString: SEGMENTS_SEARCH_SORT_KEY;
  sortKey: SEGMENTS_SEARCH_SORT_KEY;
  sortAs: SORT_AS;
}

export interface State extends AppState {
  segments: SegmentState;
}
