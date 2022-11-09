import { Inject, Injectable } from '@angular/core';
import { ENV, Environment } from '../../../environments/environment-types';
import { FeatureFlag, FeatureFlagsPaginationParams } from './store/feature-flags.model';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class FeatureFlagsDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchFeatureFlags(params: FeatureFlagsPaginationParams) {
    const url = this.environment.api.getPaginatedFlags;
    return this.http.post(url, params);
  }

  createNewFeatureFlag(flag: FeatureFlag) {
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

  updateFeatureFlag(flag: FeatureFlag) {
    const url = `${this.environment.api.featureFlag}/${flag.id}`;
    return this.http.put(url, flag);
  }
}
