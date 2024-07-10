import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';
import { FEATURE_FLAG_STATUS, FILTER_MODE, FLAG_SORT_KEY, SEGMENT_TYPE, SORT_AS_DIRECTION } from 'upgrade_types';
import { GroupForSegment, IndividualForSegment, Segment } from '../../segments/store/segments.model';

export interface FeatureFlag {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
  name: string;
  key: string;
  description: string;
  status: FEATURE_FLAG_STATUS;
  filterMode: FILTER_MODE;
  context: string[];
  tags: string[];
  enabled: boolean;
}

export interface FeatureFlagsPaginationInfo {
  nodes: FeatureFlag[];
  total: number;
  skip: number;
  take: number;
}

export interface AddFeatureFlagRequest {
  name: string;
  key: string;
  description?: string;
  context: string[];
  tags: string[];
}

export interface ModifyFeatureFlagRequest {
  id: string;
  name?: string;
  key?: string;
  description?: string;
  status?: FEATURE_FLAG_STATUS;
  filterMode?: FILTER_MODE;
  context?: string[];
  tags?: string[];
  enabled?: boolean;
}

export enum UpsertModalAction {
  ADD = 'add',
  EDIT = 'edit',
  DUPLICATE = 'duplicate',
}

export interface UpsertModalParams {
  sourceFlag: FeatureFlag;
  action: UpsertModalAction;
}

export interface UpdateFeatureFlagStatusRequest {
  flagId: string;
  status: FEATURE_FLAG_STATUS;
}

export const DuplicateFeatureFlagSuffix = '_COPY_CHANGE_ME';
export interface FeatureFlagFormData {
  name: string;
  key: string;
  description: string;
  appContext: string;
  tags: string[];
}

export interface PrivateSegment {
  segment: Segment;
}

export interface EmptyPrivateSegment {
  segment: {
    type: SEGMENT_TYPE;
  };
}

export type AnySegmentType = Segment | PrivateSegment | EmptyPrivateSegment | GroupForSegment | IndividualForSegment;

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
  name: string;
  type: string;
  values: string;
  status: string;
}

export interface FeatureFlagsPaginationParams {
  skip: number;
  take: number;
  searchParams?: IFeatureFlagsSearchParams;
  sortParams?: IFeatureFlagsSortParams;
}

export enum FEATURE_FLAG_PARTICIPANT_LIST_KEY {
  INCLUDE = 'featureFlagSegmentInclusion',
  EXCLUDE = 'featureFlagSegmentExclusion',
}

export enum FLAG_SEARCH_KEY {
  ALL = 'all',
  NAME = 'name',
  KEY = 'key',
  STATUS = 'status',
  TAG = 'tag',
  CONTEXT = 'context',
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
  hasInitialFeatureFlagsDataLoaded: boolean;
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
