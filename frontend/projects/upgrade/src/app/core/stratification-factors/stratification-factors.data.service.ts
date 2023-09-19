import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class StratificationFactorsDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchStratificationFactors() {
    const url = this.environment.api.stratification;
    return this.http.get(url);
  }
}
