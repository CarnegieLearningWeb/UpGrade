import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SettingParams } from './store/settings.model';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class SettingsDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  getSettings() {
    const url = this.environment.api.setting;
    return this.http.get(url);
  }

  setSettings(setting: SettingParams) {
    const url = this.environment.api.setting;
    return this.http.post(url, setting);
  }
}
