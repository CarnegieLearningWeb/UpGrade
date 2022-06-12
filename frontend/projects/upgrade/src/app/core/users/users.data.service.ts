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

  updateUserDetails(firstName: string, lastName: string, email: string, role: UserRole) {
    const url = environment.api.userDetails;
    return this.http.post(url, { firstName, lastName, email, role });
  }

  createNewUser(firstName: string, lastName: string, email: string, role: UserRole) {
    const url = environment.api.users;
    return this.http.post(url, { firstName, lastName, email, role });
  }

  deleteUser(email: string) {
    const url = `${environment.api.users}/${email}`;
    return this.http.delete(url);
  }
}
