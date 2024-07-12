import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';

// TODO: Move to upgrade types
export enum FLAG_SEARCH_SORT_KEY_LEGACY {
  ALL = 'all',
  NAME = 'name',
  KEY = 'key',
  STATUS = 'status',
  VARIATION_TYPE = 'variationType',
}

export enum SORT_AS_LEGACY {
  ASCENDING = 'ASC',
  DESCENDING = 'DESC',
}

interface IFeatureFlagsSearchParams_LEGACY {
  key: FLAG_SEARCH_SORT_KEY_LEGACY;
  string: string;
}

interface IFeatureFlagsSortParams_LEGACY {
  key: FLAG_SEARCH_SORT_KEY_LEGACY;
  sortAs: SORT_AS_LEGACY;
}

export interface FeatureFlagsPaginationParams_LEGACY {
  skip: number;
  take: number;
  searchParams?: IFeatureFlagsSearchParams_LEGACY;
  sortParams?: IFeatureFlagsSortParams_LEGACY;
}

export const NUMBER_OF_FLAGS_LEGACY = 20;

export enum NewFlagDialogEvents_LEGACY {
  CLOSE_DIALOG = 'Close Dialog',
  SEND_FORM_DATA = 'Send Form Data',
  UPDATE_FLAG = 'Update flag',
}

export enum NewFlagPaths_LEGACY {
  FLAG_OVERVIEW = 'Flag Overview',
  FLAG_VARIATIONS = 'Flag Variations',
}

export enum VariationTypes_LEGACY {
  CUSTOM = 'custom',
  BOOLEAN = 'boolean',
}

export enum UpsertFeatureFlagType_LEGACY {
  CREATE_NEW_FLAG = 'Create new feature flag',
  UPDATE_FLAG = 'Update feature flag',
}

export interface NewFlagDialogData_LEGACY {
  type: NewFlagDialogEvents_LEGACY;
  formData?: any;
  path?: NewFlagPaths_LEGACY;
}

export interface FlagVariation_LEGACY {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
  value: string;
  name: string;
  description: string;
  defaultVariation: boolean[];
}

export interface FeatureFlag_LEGACY {
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  id: string;
  name: string;
  key: string;
  description: string;
  variationType: string;
  status: boolean;
  variations: FlagVariation_LEGACY[];
}

export interface FeatureFlagState_LEGACY extends EntityState<FeatureFlag_LEGACY> {
  isLoadingFeatureFlags: boolean;
  skipFlags: number;
  totalFlags: number;
  searchKey: FLAG_SEARCH_SORT_KEY_LEGACY;
  searchString: string;
  sortKey: FLAG_SEARCH_SORT_KEY_LEGACY;
  sortAs: SORT_AS_LEGACY;
}

export interface State extends AppState {
  featureFlags: FeatureFlagState_LEGACY;
}
