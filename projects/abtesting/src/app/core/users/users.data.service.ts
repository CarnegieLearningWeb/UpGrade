import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UserRole } from './store/users.model';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class UsersDataService {
  constructor(private http: HttpClient) {}

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
