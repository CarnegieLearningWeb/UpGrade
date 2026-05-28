import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../api-endpoints.constants';
import { User } from '../users/store/users.model';

@Injectable()
export class AuthDataService {
  constructor(private http: HttpClient) {}

  login(userInfo: any) {
    const url = API_ENDPOINTS.loginUser;
    return this.http.post(url, userInfo);
  }

  getUserByEmail(email: string) {
    const url = `${API_ENDPOINTS.users}/${email}`;
    return this.http.get(url);
  }

  checkAuthConfig(): Observable<{ googleAuthRequired: boolean; devUser?: User }> {
    return this.http.get<{ googleAuthRequired: boolean; devUser?: User }>(API_ENDPOINTS.checkAuthConfig);
  }
}
