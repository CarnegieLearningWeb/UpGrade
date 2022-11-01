import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';

// TODO: Move to upgrade types
export enum FLAG_SEARCH_SORT_KEY {
  ALL = 'all',
  NAME = 'name',
  KEY = 'key',
  STATUS = 'status',
  VARIATION_TYPE = 'variationType',
}

export enum SORT_AS {
  ASCENDING = 'ASC',
  DESCENDING = 'DESC',
}

interface IFeatureFlagsSearchParams {
  key: FLAG_SEARCH_SORT_KEY;
  string: string;
}

interface IFeatureFlagsSortParams {
  key: FLAG_SEARCH_SORT_KEY;
  sortAs: SORT_AS;
}

export interface FeatureFlagsPaginationParams {
  skip: number;
  take: number;
  searchParams?: IFeatureFlagsSearchParams;
  sortParams?: IFeatureFlagsSortParams;
}

export const NUMBER_OF_FLAGS = 20;

export enum NewFlagDialogEvents {
  CLOSE_DIALOG = 'Close Dialog',
  SEND_FORM_DATA = 'Send Form Data',
  UPDATE_FLAG = 'Update flag',
}

export enum NewFlagPaths {
  FLAG_OVERVIEW = 'Flag Overview',
  FLAG_VARIATIONS = 'Flag Variations',
}

export enum VariationTypes {
  CUSTOM = 'custom',
  BOOLEAN = 'boolean',
}

export enum UpsertFeatureFlagType {
  CREATE_NEW_FLAG = 'Create new feature flag',
  UPDATE_FLAG = 'Update feature flag',
}

export interface NewFlagDialogData {
  type: NewFlagDialogEvents;
  formData?: any;
  path?: NewFlagPaths;
}

export interface FlagVariation {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
  value: string;
  name: string;
  description: string;
  defaultVariation: boolean[];
}

export interface FeatureFlag {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
  name: string;
  key: string;
  description: string;
  variationType: string;
  status: boolean;
  variations: FlagVariation[];
}

export interface FeatureFlagState extends EntityState<FeatureFlag> {
  isLoadingFeatureFlags: boolean;
  skipFlags: number;
  totalFlags: number;
  searchKey: FLAG_SEARCH_SORT_KEY;
  searchString: string;
  sortKey: FLAG_SEARCH_SORT_KEY;
  sortAs: SORT_AS;
}

export interface State extends AppState {
  featureFlags: FeatureFlagState;
}
