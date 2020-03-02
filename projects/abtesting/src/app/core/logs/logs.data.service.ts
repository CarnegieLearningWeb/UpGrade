import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClientService } from '../http/http-client.service';
import { LogsPagination } from './logs-pagination';

@Injectable()
export class LogsDataService {
  constructor(private http: HttpClientService) {}

  getAllAuditLogs(skip: number, fromStart: boolean) {
    const url = environment.api.getAllAuditLogs;
    const args = LogsPagination.getLogParameters(skip, fromStart);
    return this.http.post(url, args);
  }

  getAllErrorLogs(skip: number, fromStart: boolean) {
    const url = environment.api.getAllErrorLogs;
    const args = LogsPagination.getLogParameters(skip, fromStart);
    return this.http.post(url, args);
  }
}
