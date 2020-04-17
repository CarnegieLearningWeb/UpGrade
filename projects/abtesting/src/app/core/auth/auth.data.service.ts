import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClientService } from '../http/http-client.service';

@Injectable()
export class AuthDataService {
  constructor(private http: HttpClientService) {}

  createUser(userInfo: any) {
    const url = environment.api.users;
    return this.http.post(url, userInfo);
  }

  getUserByEmail(email: string) {
    const url = `${environment.api.users}/${email}`;
    return this.http.get(url);
  }
}
