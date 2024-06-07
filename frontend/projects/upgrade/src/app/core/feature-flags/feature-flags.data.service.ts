import { Inject, Injectable } from '@angular/core';
import { ENV, Environment } from '../../../environments/environment-types';
import { HttpClient } from '@angular/common/http';
import {
  AddFeatureFlagRequest,
  FeatureFlag,
  FeatureFlagsPaginationInfo,
  FeatureFlagsPaginationParams,
} from './store/feature-flags.model';
import { Observable, delay, of, skip } from 'rxjs';
import { FEATURE_FLAG_STATUS, FILTER_MODE } from '../../../../../../../types/src';

@Injectable()
export class FeatureFlagsDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchFeatureFlagsPaginated(params: FeatureFlagsPaginationParams): Observable<FeatureFlagsPaginationInfo> {
    const url = this.environment.api.getPaginatedFlags;
    return this.http.post<FeatureFlagsPaginationInfo>(url, params);
    // mock
    // return of({ nodes: mockFeatureFlags, total: 2 } as FeatureFlagsPaginationInfo).pipe(delay(2000));
  }

  addFeatureFlag(params: AddFeatureFlagRequest): Observable<FeatureFlag> {
    const url = this.environment.api.featureFlag;
    return this.http.post<FeatureFlag>(url, params);
  }
}

const mockFeatureFlags = [
  {
    createdAt: '2021-09-08T08:00:00.000Z',
    updatedAt: '2021-09-08T08:00:00.000Z',
    versionNumber: 1,
    id: '1',
    name: 'Feature Flag 1',
    key: 'feature_flag_1',
    description: 'Feature Flag 1 Description',
    status: FEATURE_FLAG_STATUS.ENABLED,
    filterMode: FILTER_MODE.INCLUDE_ALL,
    context: ['context1', 'context2'],
    tags: ['tag1', 'tag2'],
    featureFlagSegmentInclusion: null,
    featureFlagSegmentExclusion: null,
  },
  {
    createdAt: '2021-09-08T08:00:00.000Z',
    updatedAt: '2021-09-08T08:00:00.000Z',
    versionNumber: 1,
    id: '2',
    name: 'Feature Flag 2',
    key: 'feature_flag_2',
    description: 'Feature Flag 2 Description',
    status: FEATURE_FLAG_STATUS.ENABLED,
    filterMode: FILTER_MODE.INCLUDE_ALL,
    context: ['context2'],
    tags: ['tag1', 'tag2'],
    featureFlagSegmentInclusion: null,
    featureFlagSegmentExclusion: null,
  },
  {
    createdAt: '2021-09-08T08:00:00.000Z',
    updatedAt: '2021-09-08T08:00:00.000Z',
    versionNumber: 1,
    id: '3',
    name: 'Feature Flag 3',
    key: 'feature_flag_3',
    description: 'Feature Flag 3 Description',
    status: FEATURE_FLAG_STATUS.ENABLED,
    filterMode: FILTER_MODE.INCLUDE_ALL,
    context: ['context1', 'context3'],
    tags: ['tag1', 'tag2'],
    featureFlagSegmentInclusion: null,
    featureFlagSegmentExclusion: null,
  },
  {
    createdAt: '2021-09-08T08:00:00.000Z',
    updatedAt: '2021-09-08T08:00:00.000Z',
    versionNumber: 1,
    id: '4',
    name: 'Feature Flag 4',
    key: 'feature_flag_4',
    description: 'Feature Flag 4 Description',
    status: FEATURE_FLAG_STATUS.ENABLED,
    filterMode: FILTER_MODE.INCLUDE_ALL,
    context: ['context2', 'context3'],
    tags: ['tag1', 'tag2'],
    featureFlagSegmentInclusion: null,
    featureFlagSegmentExclusion: null,
  },
  {
    createdAt: '2021-09-08T08:00:00.000Z',
    updatedAt: '2021-09-08T08:00:00.000Z',
    versionNumber: 1,
    id: '5',
    name: 'Feature Flag 5',
    key: 'feature_flag_5',
    description: 'Feature Flag 5 Description',
    status: FEATURE_FLAG_STATUS.ENABLED,
    filterMode: FILTER_MODE.INCLUDE_ALL,
    context: ['context3'],
    tags: ['tag1', 'tag2'],
    featureFlagSegmentInclusion: null,
    featureFlagSegmentExclusion: null,
  },
];
