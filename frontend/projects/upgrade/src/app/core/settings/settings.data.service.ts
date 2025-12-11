import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SettingParams } from './store/settings.model';
import { API_ENDPOINTS } from '../api-endpoints.constants';

@Injectable()
export class SettingsDataService {
  constructor(private http: HttpClient) {}

  getSettings() {
    const url = API_ENDPOINTS.setting;
    return this.http.get(url);
  }

  setSettings(setting: SettingParams) {
    const url = API_ENDPOINTS.setting;
    return this.http.post(url, setting);
  }
}
