import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AuthDataService {
  constructor(private http: HttpClient) {}

  createUser(userInfo: any) {
    const url = environment.api.users;
    return this.http.post(url, userInfo);
  }

  getUserByEmail(email: string) {
    const url = `${environment.api.users}/${email}`;
    return this.http.get(url);
  }
}
