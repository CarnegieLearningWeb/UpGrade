import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthDataService {
  constructor(private http: HttpClient) {}

  createUser(userInfo: any) {
    const url = environment.api.users;
    const { token: idToken } = userInfo;
    delete userInfo['token'];
    const headers = {
      Authorization: `Bearer ${idToken}`,
    };
    return this.http.post(url, userInfo, { headers });
  }
}
