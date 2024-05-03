import { Inject, Injectable } from '@angular/core';
import { ENV, Environment } from '../../../environments/environment-types';
import { FeatureFlag_LEGACY, FeatureFlagsPaginationParams_LEGACY } from './store/feature-flags.model._LEGACY';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class FeatureFlagsDataService_LEGACY {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchFeatureFlags(params: FeatureFlagsPaginationParams_LEGACY) {
    const url = this.environment.api.getPaginatedFlags;
    return this.http.post(url, params);
  }

  createNewFeatureFlag(flag: FeatureFlag_LEGACY) {
    const url = this.environment.api.featureFlag;
    return this.http.post(url, flag);
  }

  updateFlagStatus(flagId: string, status: boolean) {
    const url = this.environment.api.updateFlagStatus;
    return this.http.post(url, { flagId, status });
  }

  deleteFeatureFlag(id: string) {
    const url = `${this.environment.api.featureFlag}/${id}`;
    return this.http.delete(url);
  }

  updateFeatureFlag(flag: FeatureFlag_LEGACY) {
    const url = `${this.environment.api.featureFlag}/${flag.id}`;
    return this.http.put(url, flag);
  }
}
