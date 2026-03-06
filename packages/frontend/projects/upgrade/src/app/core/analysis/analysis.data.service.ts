import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UpsertMetrics } from './store/analysis.models';
import { API_ENDPOINTS } from '../api-endpoints.constants';

@Injectable()
export class AnalysisDataService {
  constructor(private http: HttpClient) {}

  fetchMetrics() {
    const url = API_ENDPOINTS.metrics;
    return this.http.get(url);
  }

  upsertMetrics(metrics: UpsertMetrics) {
    const url = API_ENDPOINTS.metricsSave;
    return this.http.post(url, metrics);
  }

  deleteMetric(key: string) {
    const url = `${API_ENDPOINTS.metrics}/${key}`;
    return this.http.delete(url);
  }

  executeQuery(queryIds: string[]) {
    const url = API_ENDPOINTS.queryResult;
    return this.http.post(url, { queryIds });
  }
}
