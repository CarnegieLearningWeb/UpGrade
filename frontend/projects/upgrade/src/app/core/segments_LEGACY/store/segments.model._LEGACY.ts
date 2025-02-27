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

export enum NewSegmentDialogEvents_LEGACY {
  CLOSE_DIALOG = 'Close Dialog',
  SEND_FORM_DATA = 'Send Form Data',
  UPDATE_SEGMENT = 'Update segment',
}

export enum SegmentLocalStorageKeys_LEGACY {
  SEGMENT_SEARCH_STRING = 'SEGMENT_SEARCH_STRING',
  SEGMENT_SEARCH_KEY = 'SEGMENT_KEY_STRING',
  SEGMENT_SORT_KEY = 'SEGMENT_SORT_KEY',
  SEGMENT_SORT_TYPE = 'SEGMENT_SORT_TYPE',
}

export enum NewSegmentPaths_LEGACY {
  SEGMENT_OVERVIEW = 'Segment Overview',
  SEGMENT_MEMBERS = 'Segment Members',
}

export enum UpsertSegmentType_LEGACY {
  CREATE_NEW_SEGMENT = 'Create new segment',
  UPDATE_SEGMENT = 'Update segment',
  IMPORT_SEGMENT = 'Import segment',
}

export interface NewSegmentDialogData_LEGACY {
  type: NewSegmentDialogEvents_LEGACY;
  formData?: any;
  path?: NewSegmentPaths_LEGACY;
}

export enum MemberTypes_LEGACY {
  INDIVIDUAL = 'Individual',
  SEGMENT = 'Segment',
}

export interface experimentSegmentInclusionExclusionData_LEGACY {
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

export interface featureFlagSegmentInclusionExclusionData_LEGACY {
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

export interface Group_LEGACY {
  groupId: string;
  type: string;
}

export interface GroupForSegment_LEGACY extends Group_LEGACY {
  segmentId: string;
}

export interface membersTableRowData_LEGACY {
  type: string;
  id: string;
}

export interface IndividualForSegment_LEGACY {
  userId: string;
  segmentId: string;
}

export interface Segment_LEGACY {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
  name: string;
  context: string;
  description: string;
  individualForSegment: IndividualForSegment_LEGACY[];
  groupForSegment: GroupForSegment_LEGACY[];
  subSegments: Segment_LEGACY[];
  type: SEGMENT_TYPE;
  status: string;
}

export interface SegmentInput_LEGACY {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
  name: string;
  context: string;
  description: string;
  userIds: string[];
  groups: Group_LEGACY[];
  subSegmentIds: string[];
  type: SEGMENT_TYPE;
}

export interface SegmentState_LEGACY extends EntityState<Segment_LEGACY> {
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

export interface State_LEGACY extends AppState {
  segments: SegmentState_LEGACY;
}

export interface SegmentFile_LEGACY {
  fileName: string;
  fileContent: string | ArrayBuffer;
}

export interface importError_LEGACY {
  fileName: string;
  error: string;
}

export enum EXPORT_SEGMENT_METHOD_LEGACY {
  JSON = 'Download Segment (JSON)',
  CSV = 'Download Segment Members (CSV)',
}

export enum UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY {
  ADD_FLAG_INCLUDE_LIST = 'add_flag_include',
  EDIT_FLAG_INCLUDE_LIST = 'edit_flag_include',
  ADD_FLAG_EXCLUDE_LIST = 'add_flag_exclude',
  EDIT_FLAG_EXCLUDE_LIST = 'edit_flag_exclude',
  ADD_SEGMENT_LIST = 'add_segment_list',
  EDIT_SEGMENT_LIST = 'edit_segment_list',
}

export interface UpsertPrivateSegmentListParams_LEGACY {
  sourceList: ParticipantListTableRow;
  sourceAppContext: string;
  action: UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY;
  flagId: string;
}

export interface ImportListParams_LEGACY {
  listType: FEATURE_FLAG_LIST_FILTER_MODE;
  flagId: string;
}

export enum LIST_OPTION_TYPE_LEGACY {
  INDIVIDUAL = 'Individual',
  SEGMENT = 'Segment',
}

export const PRIVATE_SEGMENT_LIST_FORM_FIELDS_LEGACY = {
  LIST_TYPE: 'listType',
  SEGMENT: 'segment',
  VALUES: 'values',
  NAME: 'name',
  DESCRIPTION: 'description',
};

export const PRIVATE_SEGMENT_LIST_FORM_DEFAULTS_LEGACY = {
  LIST_TYPE: '',
  SEGMENT: null,
  VALUES: [],
  NAME: '',
  DESCRIPTION: '',
};

export interface PrivateSegmentListFormData_LEGACY {
  listType: LIST_OPTION_TYPE_LEGACY;
  segment?: Segment_LEGACY;
  values?: string[];
  name: string;
  description?: string;
}

export interface PrivateSegmentListRequestBase_LEGACY {
  name: string;
  description: string;
  context: string;
  type: SEGMENT_TYPE.PRIVATE;
  userIds: string[];
  groups: Group_LEGACY[];
  subSegmentIds: string[];
}

export type AddPrivateSegmentListRequestDetails_LEGACY = PrivateSegmentListRequestBase_LEGACY;
export interface EditPrivateSegmentListDetails extends PrivateSegmentListRequestBase_LEGACY {
  id: string;
}

export interface PrivateSegmentListRequest_LEGACY {
  flagId: string;
  enabled: boolean;
  listType: string;
  segment: AddPrivateSegmentListRequestDetails_LEGACY | EditPrivateSegmentListDetails;
}

export interface AddPrivateSegmentListRequest_LEGACY extends PrivateSegmentListRequest_LEGACY {
  segment: AddPrivateSegmentListRequestDetails_LEGACY;
}

export interface EditPrivateSegmentListRequest_LEGACY extends PrivateSegmentListRequest_LEGACY {
  segment: EditPrivateSegmentListDetails;
}
