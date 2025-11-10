import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';
import {
  SEGMENT_TYPE,
  SEGMENT_STATUS,
  SEGMENT_SEARCH_KEY,
  SORT_AS_DIRECTION,
  SEGMENT_SORT_KEY,
  FILTER_MODE,
  LIST_FILTER_MODE,
} from 'upgrade_types';
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
  experimentId: string;
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
  featureFlagId: string;
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
  listType?: MemberTypes | string;
  type: SEGMENT_TYPE;
  status: SEGMENT_STATUS;
}

export interface CoreSegmentDetails {
  id?: string;
  name: string;
  context: string;
  description?: string;
  tags?: string[];
  userIds: string[];
  groups: Group[];
  subSegmentIds: string[];
  status?: SEGMENT_STATUS;
  type: SEGMENT_TYPE;
}

// Currently there is no difference between these types, but they semantically different and could diverge later
export type AddSegmentRequest = CoreSegmentDetails;

// so that we can throw an error if we try to update the id
export interface UpdateSegmentRequest extends AddSegmentRequest {
  readonly id: string;
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

export const SEGMENT_ROOT_COLUMN_NAMES = {
  NAME: 'name',
  STATUS: 'status',
  UPDATED_AT: 'updatedAt',
  APP_CONTEXT: 'appContext',
  TAGS: 'tags',
  LISTS: 'lists',
};

export const SEGMENT_ROOT_DISPLAYED_COLUMNS = Object.values(SEGMENT_ROOT_COLUMN_NAMES);

export const SEGMENT_TRANSLATION_KEYS = {
  NAME: 'segments.global-name.text',
  STATUS: 'segments.global-status.text',
  UPDATED_AT: 'segments.global-updated-at.text',
  APP_CONTEXT: 'segments.global-app-context.text',
  TAGS: 'segments.global-tags.text',
  LISTS: 'segments.global-lists.text',
};

export interface ParticipantListTableRow {
  listType: MemberTypes | string;
  segment: Segment;
  enabled?: boolean;
}

export interface UsedByTableRow {
  name: string;
  link?: string;
  type: string;
  status: string;
  updatedAt: string;
}

export enum USED_BY_TYPE {
  EXPERIMENT = 'Experiment',
  FEATURE_FLAG = 'Feature Flag',
  SEGMENT = 'Segment',
}

export interface SegmentsPaginationInfo {
  nodes: Segment[];
  total: number;
  skip: number;
  take: number;
}

// TODO: This should be probably be a part of env config
export const NUMBER_OF_SEGMENTS = 20;

interface ISegmentsSearchParams {
  key: SEGMENT_SEARCH_KEY;
  string: string;
}

interface ISegmentsSortParams {
  key: SEGMENT_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
}

export interface SegmentsPaginationParams {
  skip: number;
  take: number;
  searchParams?: ISegmentsSearchParams;
  sortParams?: ISegmentsSortParams;
}

export enum SEGMENT_DETAILS_PAGE_ACTIONS {
  EDIT = 'Edit Segment',
  DUPLICATE = 'Duplicate Segment',
  DELETE = 'Delete Segment',
  EXPORT = 'Export Segment',
}

export enum SEGMENT_LIST_ACTIONS {
  IMPORT = 'Import List',
  EXPORT_ALL = 'Export All Lists',
}

export interface SegmentState extends EntityState<Segment> {
  isLoadingSegments: boolean;
  isLoadingUpsertSegment: boolean;
  // TODO: remove any
  allExperimentSegmentsInclusion: any;
  allExperimentSegmentsExclusion: any;
  allFeatureFlagSegmentsInclusion: any;
  allFeatureFlagSegmentsExclusion: any;
  allParentSegments: any;
  skipSegments: number;
  totalSegments: number;
  searchKey: SEGMENT_SEARCH_KEY;
  searchString: string;
  sortKey: SEGMENT_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
  listSegmentOptions: ListSegmentOption[];
}

export interface ListSegmentOption {
  id: string;
  name: string;
  context: string;
}

export interface GlobalSegmentState extends EntityState<Segment> {
  isLoadingSegments: boolean;
  sortKey: SEGMENT_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
}

export interface State extends AppState {
  segments: SegmentState;
  globalSegments: GlobalSegmentState;
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
  ADD_EXPERIMENT_INCLUDE_LIST = 'add_experiment_include',
  EDIT_EXPERIMENT_INCLUDE_LIST = 'edit_experiment_include',
  ADD_EXPERIMENT_EXCLUDE_LIST = 'add_experiment_exclude',
  EDIT_EXPERIMENT_EXCLUDE_LIST = 'edit_experiment_exclude',
  ADD_SEGMENT_LIST = 'add_segment_list',
  EDIT_SEGMENT_LIST = 'edit_segment_list',
}

export interface UpsertPrivateSegmentListParams {
  sourceList: ParticipantListTableRow;
  sourceAppContext: string;
  action: UPSERT_PRIVATE_SEGMENT_LIST_ACTION;
  id: string;
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

export interface ExperimentSegmentListDetails extends PrivateSegmentListRequestBase {
  id?: string;
  listType: string;
}

export interface PrivateSegmentListRequest {
  id: string;
  enabled: boolean;
  listType: string;
  segment: AddPrivateSegmentListRequestDetails | EditPrivateSegmentListDetails;
}

export interface ExperimentSegmentListRequest {
  experimentId: string;
  list: ExperimentSegmentListDetails;
}

export interface AddPrivateSegmentListRequest extends PrivateSegmentListRequest {
  segment: AddPrivateSegmentListRequestDetails;
}

export interface EditPrivateSegmentListRequest extends PrivateSegmentListRequest {
  segment: EditPrivateSegmentListDetails;
}

export enum CommonTagInputType {
  TAGS = 'tags',
  VALUES = 'values',
}

export interface SegmentFormData {
  name: string;
  description: string;
  appContext: string;
  tags: string[];
}

export enum UPSERT_SEGMENT_ACTION {
  ADD = 'add',
  EDIT = 'edit',
  DUPLICATE = 'duplicate',
}

export interface UpsertSegmentParams {
  sourceSegment: Segment;
  action: UPSERT_SEGMENT_ACTION;
}
