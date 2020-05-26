import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class SettingsDataService {
  constructor(private http: HttpClient) {}

  getSettings() {
    const url = environment.api.toCheckAuth;
    return this.http.get(url);
  }

  setSettings(toCheckAuth: boolean) {
    const url = environment.api.toCheckAuth;
    return this.http.post(url, { toCheckAuth });
  }
}
