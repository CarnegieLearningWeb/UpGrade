import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClientService } from '../http/http-client.service';

@Injectable()
export class LogsDataService {
  constructor(private http: HttpClientService) {}

  getAllAuditLogs() {
    const url = environment.api.getAllAuditLogs;
    return this.http.post(url, { skip: 0, take: 0 });
  }

  getAllErrorLogs() {
    const url = environment.api.getAllErrorLogs;
    return this.http.post(url, { skip: 0, take: 0 });
  }
}
