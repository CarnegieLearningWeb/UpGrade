import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  getVersion() {
    const url = this.environment.api.getVersion;
    return this.http.get(url).toPromise();
  }
}
