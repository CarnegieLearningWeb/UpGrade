import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../api-endpoints.constants';

@Injectable()
export class StratificationFactorsDataService {
  constructor(private http: HttpClient) {}

  fetchStratificationFactors() {
    const url = API_ENDPOINTS.stratification;
    return this.http.get(url);
  }

  importStratificationFactors(stratificationFactors) {
    const url = API_ENDPOINTS.stratification;
    return this.http.post(url, { files: stratificationFactors });
  }

  deleteStratificationFactor(id: string) {
    const url = `${API_ENDPOINTS.stratification}/${id}`;
    return this.http.delete(url);
  }

  exportStratificationFactor(id: string) {
    const url = `${API_ENDPOINTS.stratification}/download/${id}`;
    return this.http.get(url, { responseType: 'text' });
  }
}
