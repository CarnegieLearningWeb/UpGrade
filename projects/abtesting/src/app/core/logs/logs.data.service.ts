import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuditLogParams, ErrorLogParams } from './store/logs.model';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class LogsDataService {
  constructor(private http: HttpClient) {}

  getAllAuditLogs(params: AuditLogParams) {
    const url = environment.api.getAllAuditLogs;
    return this.http.post(url, params);
  }

  getAllErrorLogs(params: ErrorLogParams) {
    const url = environment.api.getAllErrorLogs;
    return this.http.post(url, params);
  }
}
