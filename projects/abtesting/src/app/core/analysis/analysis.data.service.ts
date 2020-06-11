import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Query } from './store/analysis.models';

@Injectable()
export class AnalysisDataService {

  constructor(private http: HttpClient) {}

  fetchMetrics() {
    const url = environment.api.metrics;
    return this.http.get(url);
  }

  fetchQueries() {
    const url = environment.api.query;
    return this.http.get(url);
  }

  // TODO: Remove query related end points
  saveQueries(query: Query) {
    const url = environment.api.query;
    return this.http.post(url, query);
  }

  deleteQuery(queryId: string) {
    const url = `${environment.api.query}/${queryId}`;
    return this.http.delete(url);
  }

  executeQuery(queryId: string) {
    const url = environment.api.queryResult;
    return this.http.post(url, { queryId });
  }
}
