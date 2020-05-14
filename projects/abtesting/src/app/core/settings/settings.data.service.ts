import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClientService } from '../http/http-client.service';

@Injectable()
export class SettingsDataService {
  constructor(private http: HttpClientService) {}

  getSettings() {
    const url = environment.api.toCheckAuth;
    return this.http.get(url);
  }

  setSettings(toCheckAuth: boolean) {
    const url = environment.api.toCheckAuth;
    return this.http.post(url, { toCheckAuth });
  }
}
