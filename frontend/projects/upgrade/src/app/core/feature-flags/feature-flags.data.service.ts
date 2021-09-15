import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FeatureFlag, FeatureFlagsPaginationParams } from './store/feature-flags.model';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class FeatureFlagsDataService {
  constructor(private http: HttpClient) { }

  fetchFeatureFlags(params: FeatureFlagsPaginationParams) {
    const url = environment.api.getPaginatedFlags;
    return this.http.post(url, params);
  }

  createNewFeatureFlag(flag: FeatureFlag) {
    const url = environment.api.featureFlag;
    return this.http.post(url , flag);
  }

  updateFlagStatus(flagId: string, status: boolean) {
    const url = environment.api.updateFlagStatus;
    return this.http.post(url, { flagId, status });
  }

  deleteFeatureFlag(id: string) {
    const url = `${environment.api.featureFlag}/${id}`;
    return this.http.delete(url);
  }

  updateFeatureFlag(flag: FeatureFlag) {
    const url = `${environment.api.featureFlag}/${flag.id}`;
    return this.http.put(url, flag);
  }
}
