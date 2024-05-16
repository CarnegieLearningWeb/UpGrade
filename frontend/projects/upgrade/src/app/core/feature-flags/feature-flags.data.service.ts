import { Inject, Injectable } from '@angular/core';
import { ENV, Environment } from '../../../environments/environment-types';
import { HttpClient } from '@angular/common/http';
import { FeatureFlagsPaginationParams } from './store/feature-flags.model';

@Injectable()
export class FeatureFlagsDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchFeatureFlagsPaginated(params: FeatureFlagsPaginationParams) {
    const url = this.environment.api.getPaginatedFlags;
    return this.http.post(url, params);
  }
}
