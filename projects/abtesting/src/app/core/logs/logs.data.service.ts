import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClientService } from '../http/http-client.service';

@Injectable()
export class LogsDataService {

  constructor(private http: HttpClientService) {}

  getAllAudits() {
    const url = environment.api.getAllAudits;
    return this.http.post(url, { skip: 0, take: 0 });
  }
}
