import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';
import { SEGMENT_TYPE } from 'upgrade_types';

export enum NewSegmentDialogEvents {
  CLOSE_DIALOG = 'Close Dialog',
  SEND_FORM_DATA = 'Send Form Data',
  UPDATE_SEGMENT = 'Update segment'
}

export enum NewSegmentPaths {
  SEGMENT_OVERVIEW = 'Segment Overview',
  SEGMENT_MEMBERS = 'Segment Members',
}

export enum UpsertSegmentType {
  CREATE_NEW_SEGMENT = 'Create new segment',
  UPDATE_SEGMENT = 'Update segment'
}

export interface NewSegmentDialogData {
  type: NewSegmentDialogEvents;
  formData?: any;
  path?: NewSegmentPaths;
}

export enum MemberTypes {
  INDIVIDUAL = 'Individual',
  SEGMENT = 'Segment'
}

export interface GroupForSegment {
  groupId: string;
  type: string;
  segmentId: string;
}

export interface individualForSegment {
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
  individualForSegment: individualForSegment[];
  groupForSegment: GroupForSegment[];
  subSegments: Segment[];
  type: SEGMENT_TYPE;
}

export interface SegmentVM extends Segment {
  userIds: string[];
  groups: { groupId: string, type: string }[];
  subSegmentIds: string[];
}
export interface SegmentState extends EntityState<Segment> {
  isLoadingSegments: boolean;
}

export interface State extends AppState {
  segments: SegmentState;
}
