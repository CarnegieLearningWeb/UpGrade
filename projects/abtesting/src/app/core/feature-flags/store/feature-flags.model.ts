import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';

export enum NewFlagDialogEvents {
  CLOSE_DIALOG = 'Close Dialog',
  SEND_FORM_DATA = 'Send Form Data',
  UPDATE_FLAG = 'Update flag'
}

export enum NewFlagPaths {
  FLAG_OVERVIEW = 'Flag Overview',
  FLAG_VARIATIONS = 'Flag Variations',
}

export enum VariationTypes {
  CUSTOM = 'custom',
  BOOLEAN = 'boolean'
}

export enum UpsertFeatureFlagType {
  CREATE_NEW_FLAG = 'Create new feature flag',
  UPDATE_FLAG = 'Update feature flag'
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
}

export interface State extends AppState {
  featureFlags: FeatureFlagState;
}
