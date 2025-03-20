import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';
import {
  SEGMENT_TYPE,
  SEGMENT_STATUS,
  SEGMENT_SEARCH_KEY,
  SORT_AS_DIRECTION,
  SEGMENT_SORT_KEY,
  FEATURE_FLAG_LIST_FILTER_MODE,
} from 'upgrade_types';
import { ParticipantListTableRow } from '../../feature-flags/store/feature-flags.model';
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

export enum SEGMENTS_BUTTON_ACTION {
  IMPORT = 'import segment',
  EXPORT_ALL = 'export all segments',
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

export interface featureFlagSegmentInclusionExclusionData {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  featureFlag: {
    name: string;
    context: any[];
    status: string;
  };
  segment: {
    id: string;
    subSegments: any[];
  };
}

export interface Group {
  groupId: string;
  type: string;
}

export interface GroupForSegment extends Group {
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
  tags: string[];
  description: string;
  individualForSegment: IndividualForSegment[];
  groupForSegment: GroupForSegment[];
  subSegments: Segment[];
  type: SEGMENT_TYPE;
  status: SEGMENT_STATUS;
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
  groups: Group[];
  subSegmentIds: string[];
  type: SEGMENT_TYPE;
}

export enum SEGMENT_DETAILS_PAGE_ACTIONS {
  EDIT = 'Edit Segment',
  DUPLICATE = 'Duplicate Segment',
  DELETE = 'Delete Segment',
  EXPORT = 'Export Segment',
}

export interface SegmentState extends EntityState<Segment> {
  isLoadingSegments: boolean;
  // TODO: remove any
  allExperimentSegmentsInclusion: any;
  allExperimentSegmentsExclusion: any;
  allFeatureFlagSegmentsInclusion: any;
  allFeatureFlagSegmentsExclusion: any;
  searchKey: SEGMENT_SEARCH_KEY;
  searchString: string;
  sortKey: SEGMENT_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
}

export interface State extends AppState {
  segments: SegmentState;
}

export interface SegmentFile {
  fileName: string;
  fileContent: string | ArrayBuffer;
}

export interface importError {
  fileName: string;
  error: string;
}

export enum EXPORT_SEGMENT_METHOD {
  JSON = 'Download Segment (JSON)',
  CSV = 'Download Segment Members (CSV)',
}

export enum UPSERT_PRIVATE_SEGMENT_LIST_ACTION {
  ADD_FLAG_INCLUDE_LIST = 'add_flag_include',
  EDIT_FLAG_INCLUDE_LIST = 'edit_flag_include',
  ADD_FLAG_EXCLUDE_LIST = 'add_flag_exclude',
  EDIT_FLAG_EXCLUDE_LIST = 'edit_flag_exclude',
  ADD_SEGMENT_LIST = 'add_segment_list',
  EDIT_SEGMENT_LIST = 'edit_segment_list',
}

export interface UpsertPrivateSegmentListParams {
  sourceList: ParticipantListTableRow;
  sourceAppContext: string;
  action: UPSERT_PRIVATE_SEGMENT_LIST_ACTION;
  flagId: string;
}

export interface ImportListParams {
  listType: FEATURE_FLAG_LIST_FILTER_MODE;
  flagId: string;
}

export enum LIST_OPTION_TYPE {
  INDIVIDUAL = 'Individual',
  SEGMENT = 'Segment',
}

export const PRIVATE_SEGMENT_LIST_FORM_FIELDS = {
  LIST_TYPE: 'listType',
  SEGMENT: 'segment',
  VALUES: 'values',
  NAME: 'name',
  DESCRIPTION: 'description',
};

export const PRIVATE_SEGMENT_LIST_FORM_DEFAULTS = {
  LIST_TYPE: '',
  SEGMENT: null,
  VALUES: [],
  NAME: '',
  DESCRIPTION: '',
};

export interface PrivateSegmentListFormData {
  listType: LIST_OPTION_TYPE;
  segment?: Segment;
  values?: string[];
  name: string;
  description?: string;
}

export interface PrivateSegmentListRequestBase {
  name: string;
  description: string;
  context: string;
  type: SEGMENT_TYPE.PRIVATE;
  userIds: string[];
  groups: Group[];
  subSegmentIds: string[];
}

export type AddPrivateSegmentListRequestDetails = PrivateSegmentListRequestBase;
export interface EditPrivateSegmentListDetails extends PrivateSegmentListRequestBase {
  id: string;
}

export interface PrivateSegmentListRequest {
  flagId: string;
  enabled: boolean;
  listType: string;
  segment: AddPrivateSegmentListRequestDetails | EditPrivateSegmentListDetails;
}

export interface AddPrivateSegmentListRequest extends PrivateSegmentListRequest {
  segment: AddPrivateSegmentListRequestDetails;
}

export interface EditPrivateSegmentListRequest extends PrivateSegmentListRequest {
  segment: EditPrivateSegmentListDetails;
}
