import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UpsertMetrics } from './store/analysis.models';

@Injectable()
export class AnalysisDataService {

  constructor(private http: HttpClient) {}

  fetchMetrics() {
    const url = environment.api.metrics;
    return this.http.get(url);
  }

  upsertMetrics(metrics: UpsertMetrics) {
    const url = environment.api.metricsSave;
    return this.http.post(url, metrics);
  }

  deleteMetric(key: string) {
    const url = `${environment.api.metrics}/${key}`;
    return this.http.delete(url);
  }

  executeQuery(queryId: string) {
    const url = environment.api.queryResult;
    return this.http.post(url, { queryId });
  }
}
