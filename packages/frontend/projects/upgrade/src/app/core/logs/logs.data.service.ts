import { Injectable } from '@angular/core';
import { AuditLogParams, ErrorLogParams } from './store/logs.model';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../api-endpoints.constants';

@Injectable()
export class LogsDataService {
  constructor(private http: HttpClient) {}

  getAllAuditLogs(params: AuditLogParams) {
    const url = API_ENDPOINTS.getAllAuditLogs;
    return this.http.post(url, params);
  }

  getAllErrorLogs(params: ErrorLogParams) {
    const url = API_ENDPOINTS.getAllErrorLogs;
    return this.http.post(url, params);
  }
}
