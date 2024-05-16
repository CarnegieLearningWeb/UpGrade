import { Inject, Injectable } from '@angular/core';
import { ENV, Environment } from '../../../environments/environment-types';
import { HttpClient } from '@angular/common/http';
import { FeatureFlag, FeatureFlagsPaginationParams } from './store/feature-flags.model';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';

@Injectable()
export class FeatureFlagsDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchAllFeatureFlags() {
    const url = this.environment.api.featureFlag;
    return this.http.get(url);
  }

  fetchFeatureFlagById(id: string) {
    const url = `${this.environment.api.featureFlag}/${id}`;
    return this.http.get(url);
  }

  fetchFeatureFlagsPaginated(params: FeatureFlagsPaginationParams) {
    const url = this.environment.api.getPaginatedFlags;
    return this.http.post(url, params);
  }

  createNewFeatureFlag(flag: FeatureFlag) {
    const url = this.environment.api.featureFlag;
    return this.http.post(url, flag);
  }

  updateFlagStatus(flagId: string, status: FEATURE_FLAG_STATUS) {
    const url = this.environment.api.updateFlagStatus;
    return this.http.post(url, { flagId, status });
  }

  deleteFeatureFlag(id: string) {
    const url = `${this.environment.api.featureFlag}/${id}`;
    return this.http.delete(url);
  }

  updateFeatureFlag(flag: FeatureFlag) {
    const url = `${this.environment.api.featureFlag}/${flag.id}`;
    return this.http.put(url, flag);
  }
}
