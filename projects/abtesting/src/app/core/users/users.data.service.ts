import { Injectable } from '@angular/core';
import { HttpClientService } from '../http/http-client.service';
import { environment } from '../../../environments/environment';
import { UserRole } from './store/users.model';

@Injectable()
export class UsersDataService {
  constructor(private http: HttpClientService) {}

  fetchUsers(params: any) {
    const url = environment.api.getAllUsers;
    return this.http.post(url, params);
  }

  updateUserRole(email: string, role: UserRole) {
    const url = environment.api.userRole;
    return this.http.post(url, { email, role });
  }

  createNewUser(email: string, role: UserRole) {
    const url = environment.api.users;
    return this.http.post(url, { email, role });
  }
}
