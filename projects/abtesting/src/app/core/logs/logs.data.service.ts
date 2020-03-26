import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClientService } from '../http/http-client.service';
import { AuditLogParams, ErrorLogParams } from './store/logs.model';

@Injectable()
export class LogsDataService {
  constructor(private http: HttpClientService) {}

  getAllAuditLogs(params: AuditLogParams) {
    const url = environment.api.getAllAuditLogs;
    return this.http.post(url, params);
  }

  getAllErrorLogs(params: ErrorLogParams) {
    const url = environment.api.getAllErrorLogs;
    return this.http.post(url, params);
  }
}
