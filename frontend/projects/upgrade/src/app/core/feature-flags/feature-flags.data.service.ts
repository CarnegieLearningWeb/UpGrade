import { Inject, Injectable } from '@angular/core';
import { ENV, Environment } from '../../../environments/environment-types';
import { HttpClient } from '@angular/common/http';
import {
  AddFeatureFlagRequest,
  FeatureFlag,
  FeatureFlagsPaginationInfo,
  FeatureFlagsPaginationParams,
  UpdateFeatureFlagStatusRequest,
} from './store/feature-flags.model';
import { Observable } from 'rxjs';
import { FeatureFlagFile } from '../../features/dashboard/feature-flags/modals/import-feature-flag-modal/import-feature-flag-modal.component';

@Injectable()
export class FeatureFlagsDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchFeatureFlagsPaginated(params: FeatureFlagsPaginationParams): Observable<FeatureFlagsPaginationInfo> {
    const url = this.environment.api.getPaginatedFlags;
    return this.http.post<FeatureFlagsPaginationInfo>(url, params);
    // mock
    // // return of({ nodes: mockFeatureFlags, total: 2 }).pipe(delay(2000));
  }

  fetchFeatureFlagById(id: string) {
    const url = `${this.environment.api.featureFlag}/${id}`;
    return this.http.get(url);
  }

  addFeatureFlag(params: AddFeatureFlagRequest): Observable<FeatureFlag> {
    const url = this.environment.api.featureFlag;
    return this.http.post<FeatureFlag>(url, params);
  }

  updateFeatureFlagStatus(params: UpdateFeatureFlagStatusRequest): Observable<FeatureFlag> {
    const url = this.environment.api.updateFlagStatus;
    return this.http.post<FeatureFlag>(url, params);
  }

  deleteFeatureFlag(id: string) {
    const url = `${this.environment.api.featureFlag}/${id}`;
    return this.http.delete(url);
  }

  updateFeatureFlag(flag: FeatureFlag): Observable<FeatureFlag> {
    const url = `${this.environment.api.featureFlag}/${flag.id}`;
    return this.http.put<FeatureFlag>(url, flag);
  }

  validateFeatureFlag(featureFlag: FeatureFlagFile[]) {
    const url = this.environment.api.validateFeatureFlag;
    return this.http.post(url, featureFlag);
  }
}
