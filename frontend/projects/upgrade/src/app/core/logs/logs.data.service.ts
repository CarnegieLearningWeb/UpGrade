import { Inject, Injectable } from '@angular/core';
import { ENV, Environment } from '../../../environments/environment-types';
import { AuditLogParams, ErrorLogParams } from './store/logs.model';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class LogsDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  getAllAuditLogs(params: AuditLogParams) {
    const url = this.environment.api.getAllAuditLogs;
    return this.http.post(url, params);
  }

  getAllErrorLogs(params: ErrorLogParams) {
    const url = this.environment.api.getAllErrorLogs;
    return this.http.post(url, params);
  }
}
