import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class AuthDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  login(userInfo: any) {
    const url = this.environment.api.loginUser;
    return this.http.post(url, userInfo);
  }

  getUserByEmail(email: string) {
    const url = `${this.environment.api.users}/${email}`;
    return this.http.get(url);
  }
}
