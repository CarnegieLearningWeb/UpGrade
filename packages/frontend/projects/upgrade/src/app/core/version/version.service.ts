import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../api-endpoints.constants';

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  constructor(private http: HttpClient) {}

  getVersion() {
    const url = API_ENDPOINTS.getVersion;
    return this.http.get(url).toPromise();
  }
}
