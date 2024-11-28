import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';
import { FEATURE_FLAG_STATUS, FILTER_MODE, FLAG_SEARCH_KEY, FLAG_SORT_KEY, SORT_AS_DIRECTION } from 'upgrade_types';
import { MemberTypes, Segment } from '../../segments/store/segments.model';

// This obviously is a more global type, but for now we're not about to refactor all of the things, so I'm just putting it here so I can create some more dev-friendly types to catch the small differences between some of these formats
export interface GeneralCRUDResponseFields {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
}

export enum FeatureFlagLocalStorageKeys {
  FEATURE_FLAG_SEARCH_STRING = 'FEATURE_FLAG_SEARCH_STRING',
  FEATURE_FLAG_SEARCH_KEY = 'FEATURE_FLAG_KEY_STRING',
  FEATURE_FLAG_SORT_KEY = 'FEATURE_FLAG_SORT_KEY',
  FEATURE_FLAG_SORT_TYPE = 'FEATURE_FLAG_SORT_TYPE',
}

export interface CoreFeatureFlagDetails {
  id?: string;
  name: string;
  key: string;
  description?: string;
  context: string[];
  tags: string[];
  status: FEATURE_FLAG_STATUS;
  filterMode: FILTER_MODE;
}

// Fields belonging to the FeatureFlag entity itself that are not part of the CRUD response
export interface BaseFeatureFlag extends CoreFeatureFlagDetails {
  featureFlagSegmentInclusion: FeatureFlagSegmentListDetails[];
  featureFlagSegmentExclusion: FeatureFlagSegmentListDetails[];
}

// Feature Flag entity = base + db-generated fields (we depend on createdOn for sorting, for instance, but it's not truly part of the feature flag base)
export type FeatureFlag = BaseFeatureFlag & GeneralCRUDResponseFields;

// Currently there is no difference between these types, but they semantically different and could diverge later
export type AddFeatureFlagRequest = CoreFeatureFlagDetails;

// so that we can throw an error if we try to update the id
export interface UpdateFeatureFlagRequest extends AddFeatureFlagRequest {
  readonly id: string;
}

export interface FeatureFlagSegmentListDetails {
  segment: Segment;
  featureFlag: FeatureFlag;
  enabled: boolean;
  listType: MemberTypes | string;
}

export enum UPSERT_FEATURE_FLAG_ACTION {
  ADD = 'add',
  EDIT = 'edit',
  DUPLICATE = 'duplicate',
}

export interface UpsertFeatureFlagParams {
  sourceFlag: FeatureFlag;
  action: UPSERT_FEATURE_FLAG_ACTION;
}

export enum UPSERT_FEATURE_FLAG_LIST_ACTION {
  ADD = 'add',
  EDIT = 'edit',
}

export interface ValidateFeatureFlagError {
  fileName: string;
  compatibilityType: string;
}

export interface FeatureFlagsPaginationInfo {
  nodes: FeatureFlag[];
  total: number;
  skip: number;
  take: number;
}

export interface UpdateFeatureFlagStatusRequest {
  flagId: string;
  status: FEATURE_FLAG_STATUS;
}

export interface UpdateFilterModeRequest {
  flagId: string;
  filterMode: FILTER_MODE;
}

export interface FeatureFlagFormData {
  name: string;
  key: string;
  description: string;
  appContext: string;
  tags: string[];
}

// TODO: This should be probably be a part of env config
export const NUMBER_OF_FLAGS = 20;

interface IFeatureFlagsSearchParams {
  key: FLAG_SEARCH_KEY;
  string: string;
}

interface IFeatureFlagsSortParams {
  key: FLAG_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
}

export interface ParticipantListTableRow {
  listType: MemberTypes | string;
  segment: Segment;
  enabled?: boolean;
}

export enum PARTICIPANT_LIST_ROW_ACTION {
  ENABLE = 'enable',
  DISABLE = 'disable',
  EDIT = 'edit',
  DELETE = 'delete',
}

export interface ParticipantListRowActionEvent {
  action: PARTICIPANT_LIST_ROW_ACTION;
  rowData: ParticipantListTableRow;
}

export enum CommonTagInputType {
  TAGS = 'tags',
  VALUES = 'values',
}

// the request for for the upserting private segment is PrivateSegmentListRequest
// there is no difference in that request and that which will be used for segment lists in the future
export interface UpsertFeatureFlagPrivateSegmentListResponse {
  featureFlag: FeatureFlag;
  segment: Segment;
  listType: MemberTypes | string;
  enabled: boolean;
}

export interface FeatureFlagsPaginationParams {
  skip: number;
  take: number;
  searchParams?: IFeatureFlagsSearchParams;
  sortParams?: IFeatureFlagsSortParams;
}

export enum FEATURE_FLAG_DETAILS_PAGE_ACTIONS {
  EDIT = 'Edit Feature Flag',
  DUPLICATE = 'Duplicate Feature Flag',
  ARCHIVE = 'Archive Feature Flag',
  DELETE = 'Delete Feature Flag',
  EXPORT_DESIGN = 'Export Feature Flag Design',
  EMAIL_DATA = 'Email Feature Flag Data',
}

export const FLAG_ROOT_COLUMN_NAMES = {
  NAME: 'name',
  STATUS: 'status',
  UPDATED_AT: 'updatedAt',
  APP_CONTEXT: 'appContext',
  TAGS: 'tags',
  EXPOSURES: 'exposures',
};

export const FLAG_TRANSLATION_KEYS = {
  NAME: 'feature-flags.global-name.text',
  STATUS: 'feature-flags.global-status.text',
  UPDATED_AT: 'feature-flags.global-updated-at.text',
  APP_CONTEXT: 'feature-flags.global-app-context.text',
  TAGS: 'feature-flags.global-tags.text',
  EXPOSURES: 'feature-flags.global-exposures.text',
};

export const FLAG_ROOT_DISPLAYED_COLUMNS = Object.values(FLAG_ROOT_COLUMN_NAMES);

export interface FeatureFlagState extends EntityState<FeatureFlag> {
  isLoadingUpsertFeatureFlag: boolean;
  isLoadingSelectedFeatureFlag: boolean;
  isLoadingFeatureFlags: boolean;
  isLoadingUpdateFeatureFlagStatus: boolean;
  isLoadingFeatureFlagDelete: boolean;
  isLoadingUpsertPrivateSegmentList: boolean;
  hasInitialFeatureFlagsDataLoaded: boolean;
  duplicateKeyFound: boolean;
  activeDetailsTabIndex: number;
  skipFlags: number;
  totalFlags: number;
  searchKey: FLAG_SEARCH_KEY;
  searchValue: string;
  sortKey: FLAG_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
}

export interface State extends AppState {
  featureFlags: FeatureFlagState;
}
