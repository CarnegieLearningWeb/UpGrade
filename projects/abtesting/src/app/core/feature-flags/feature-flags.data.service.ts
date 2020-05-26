import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FeatureFlag } from './store/feature-flags.model';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class FeatureFlagsDataService {
  constructor(private http: HttpClient) { }

  fetchAllFeatureFlags() {
    const url = environment.api.featureFlag;
    return this.http.get(url);
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
