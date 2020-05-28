import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IQueryBuilder } from './store/analysis.models';

@Injectable()
export class AnalysisDataService {

  constructor(private http: HttpClient) {}

  fetchAnalysisData(data: IQueryBuilder) {
    const url = environment.api.fetchAnalysis;
    return this.http.post(url, data);
  }
}
