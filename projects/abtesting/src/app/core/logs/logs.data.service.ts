import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClientService } from '../http/http-client.service';
import { LogsPagination } from './logs-pagination';
import { AuditLogFilters, ErrorLogFilters } from './store/logs.model';

@Injectable()
export class LogsDataService {
  constructor(private http: HttpClientService) {}

  getAllAuditLogs(skip: number, fromStart: boolean, filterType: AuditLogFilters) {
    const url = environment.api.getAllAuditLogs;
    const args = LogsPagination.getLogParameters(skip, fromStart);
    console.log('Filter type data service ', filterType);
    return this.http.post(url, args);
  }

  getAllErrorLogs(skip: number, fromStart: boolean, filterType: ErrorLogFilters) {
    const url = environment.api.getAllErrorLogs;
    const args = LogsPagination.getLogParameters(skip, fromStart);
    console.log('Filter type data service for Error', filterType);
    return this.http.post(url, args);
  }
}
