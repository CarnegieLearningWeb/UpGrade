import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UpsertMetrics } from './store/analysis.models';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class AnalysisDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchMetrics() {
    const url = this.environment.api.metrics;
    return this.http.get(url);
  }

  upsertMetrics(metrics: UpsertMetrics) {
    const url = this.environment.api.metricsSave;
    return this.http.post(url, metrics);
  }

  deleteMetric(key: string) {
    const url = `${this.environment.api.metrics}/${key}`;
    return this.http.delete(url);
  }

  executeQuery(queryIds: string[]) {
    const url = this.environment.api.queryResult;
    return this.http.post(url, { queryIds });
  }
}
