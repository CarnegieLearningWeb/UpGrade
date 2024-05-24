import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';
import { FEATURE_FLAG_STATUS, FILTER_MODE, FLAG_SORT_KEY, SORT_AS_DIRECTION } from 'upgrade_types';
import { SegmentNew } from '../../experiments/store/experiments.model';

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
  featureFlagSegmentInclusion: SegmentNew;
  featureFlagSegmentExclusion: SegmentNew;
}

export interface CreateFeatureFlagDTO {
  name: string;
  key: string;
  description: string;
  status: FEATURE_FLAG_STATUS;
  context: string[];
  tags: string[];
  featureFlagSegmentInclusion: SegmentNew;
  featureFlagSegmentExclusion: SegmentNew;
  filterMode: FILTER_MODE;
}

export const NUMBER_OF_FLAGS = 20;

interface IFeatureFlagsSearchParams {
  key: FLAG_SEARCH_KEY;
  string: string;
}

interface IFeatureFlagsSortParams {
  key: FLAG_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
}

export interface FeatureFlagsPaginationParams {
  skip: number;
  take: number;
  searchParams?: IFeatureFlagsSearchParams;
  sortParams?: IFeatureFlagsSortParams;
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
  NAME: 'Name',
  STATUS: 'Status',
  UPDATED_AT: 'Updated at',
  APP_CONTEXT: 'App Context',
  TAGS: 'Tags',
  EXPOSURES: 'Exposures',
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
  isLoadingFeatureFlags: boolean;
  hasInitialFeatureFlagsDataLoaded: boolean;
  skipFlags: number;
  totalFlags: number;
  searchKey: FLAG_SEARCH_KEY;
  searchString: string;
  sortKey: FLAG_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
}

export interface State extends AppState {
  featureFlags: FeatureFlagState;
}
