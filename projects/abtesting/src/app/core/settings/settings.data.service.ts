import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { SettingParams } from './store/settings.model';

@Injectable()
export class SettingsDataService {
  constructor(private http: HttpClient) {}

  getSettings() {
    const url = environment.api.setting;
    return this.http.get(url);
  }

  setSettings(setting: SettingParams) {
    const url = environment.api.setting;
    return this.http.post(url, setting);
  }
}
