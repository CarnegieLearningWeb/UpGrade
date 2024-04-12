import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';
import { SEGMENT_TYPE, SEGMENT_STATUS } from 'upgrade_types';
import {
  SEGMENT_SEARCH_KEY,
  SEGMENT_SORT_AS,
  SEGMENT_SORT_KEY,
} from '../../../../../../../../types/src/Experiment/enums';
export { SEGMENT_STATUS };

export enum NewSegmentDialogEvents {
  CLOSE_DIALOG = 'Close Dialog',
  SEND_FORM_DATA = 'Send Form Data',
  UPDATE_SEGMENT = 'Update segment',
}

export enum SegmentLocalStorageKeys {
  SEGMENT_SEARCH_STRING = 'SEGMENT_SEARCH_STRING',
  SEGMENT_SEARCH_KEY = 'SEGMENT_KEY_STRING',
  SEGMENT_SORT_KEY = 'SEGMENT_SORT_KEY',
  SEGMENT_SORT_TYPE = 'SEGMENT_SORT_TYPE',
}

export enum NewSegmentPaths {
  SEGMENT_OVERVIEW = 'Segment Overview',
  SEGMENT_MEMBERS = 'Segment Members',
}

export enum UpsertSegmentType {
  CREATE_NEW_SEGMENT = 'Create new segment',
  UPDATE_SEGMENT = 'Update segment',
  IMPORT_SEGMENT = 'Import segment',
}

export interface NewSegmentDialogData {
  type: NewSegmentDialogEvents;
  formData?: any;
  path?: NewSegmentPaths;
}

export enum MemberTypes {
  INDIVIDUAL = 'Individual',
  SEGMENT = 'Segment',
}

export interface experimentSegmentInclusionExclusionData {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  experiment: {
    name: string;
    context: any[];
    state: string;
  };
  segment: {
    id: string;
    subSegments: any[];
  };
}

export interface GroupForSegment {
  groupId: string;
  type: string;
  segmentId: string;
}

export interface membersTableRowData {
  type: string;
  id: string;
}

export interface IndividualForSegment {
  userId: string;
  segmentId: string;
}

export interface Segment {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
  name: string;
  context: string;
  description: string;
  individualForSegment: IndividualForSegment[];
  groupForSegment: GroupForSegment[];
  subSegments: Segment[];
  type: SEGMENT_TYPE;
  status: string;
}

export interface SegmentInput {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
  name: string;
  context: string;
  description: string;
  userIds: string[];
  groups: { groupId: string; type: string }[];
  subSegmentIds: string[];
  type: SEGMENT_TYPE;
}

export interface SegmentState extends EntityState<Segment> {
  isLoadingSegments: boolean;
  // TODO: remove any
  allExperimentSegmentsInclusion: any;
  allExperimentSegmentsExclusion: any;
  searchKey: SEGMENT_SEARCH_KEY;
  searchString: string;
  sortKey: SEGMENT_SORT_KEY;
  sortAs: SEGMENT_SORT_AS;
}

export interface State extends AppState {
  segments: SegmentState;
}

export interface SegmentFile {
  fileName: string;
  fileContent: string | ArrayBuffer;
}

export interface SegmentReturnedObj {
  segments: Segment[];
  importErrors: SegmentImportError[];
}

export interface SegmentImportError {
  fileName: string;
  error: string;
}

export enum EXPORT_SEGMENT_METHOD {
  JSON = 'Download Segment (JSON)',
  CSV = 'Download Segment Members (CSV)',
}
