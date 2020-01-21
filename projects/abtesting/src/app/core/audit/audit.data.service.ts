import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuditDataService {

  constructor(private http: HttpClient) {}

  getAllAudits() {
    const url = environment.api.getAllAudits;
    return this.http.post(url, { skip: 0, take: 0 });
  }
}
