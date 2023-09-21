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

  deleteStratificationFactor(id: string) {
    const url = `${this.environment.api.stratification}/${id}`;
    return this.http.delete(url);
  }

  exportStratificationFactor(id: string) {
    const url = `${this.environment.api.stratification}/download/${id}`;
    return this.http.get(url);
  }
}
