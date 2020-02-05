import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuditDataService {

  constructor(private http: HttpClient) {}

  getAllAudits(idToken: string) {
    const url = environment.api.getAllAudits;
    const headers = {
      Authorization: `Bearer ${idToken}`,
    };
    return this.http.post(url, { skip: 0, take: 0 }, { headers });
  }
}
