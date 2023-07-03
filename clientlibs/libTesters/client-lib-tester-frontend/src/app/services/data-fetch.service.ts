import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HookRequestBody } from '../../../../shared/models';

@Injectable({
  providedIn: 'root',
})
export class DataFetchService {
  private TSBackendUrl = 'http://localhost:3000';
  private JavaBackendUrl = '';

  constructor(public http: HttpClient) {}

  getVersionFromAPIHost(url: string): Observable<string> {
    return this.http.get<string>(url + '/api/version');
  }

  getAppInterfaceModelsFromTSBackend() {
    return this.http.get(this.TSBackendUrl + '/api/mock-app-models');
  }

  postHookToTSBackend(hookEvent: HookRequestBody) {
    return this.http.post(this.TSBackendUrl + '/api/hook', hookEvent);
  }
}
