import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { UpsertMetrics } from './store/analysis.models';
import { API_ENDPOINTS } from '../api-endpoints.constants';
import { SKIP_NAVIGATION_CANCEL } from '../http-interceptors/http-cancel.interceptor';

@Injectable()
export class AnalysisDataService {
  constructor(private http: HttpClient) {}

  fetchMetrics() {
    const url = API_ENDPOINTS.metrics;
    // The metrics catalog is app-wide state kept fresh reactively (e.g. after an experiment is
    // deleted or its metrics change), not data scoped to whichever page triggered the fetch, so
    // it shouldn't be aborted by HttpCancelInterceptor if the user navigates before it resolves.
    return this.http.get(url, { context: new HttpContext().set(SKIP_NAVIGATION_CANCEL, true) });
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
