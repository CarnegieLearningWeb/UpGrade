import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataFetchService {
  constructor(public http: HttpClient) { }

  getVersionFromAPIHost(url: string) {
    return this.http.get<string>(url + '/api/version');
  }
}
