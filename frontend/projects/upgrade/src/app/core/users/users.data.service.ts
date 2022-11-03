import { Inject, Injectable } from '@angular/core';
import { UserRole } from './store/users.model';
import { HttpClient } from '@angular/common/http';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class UsersDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchUsers(params: any) {
    const url = this.environment.api.getAllUsers;
    return this.http.post(url, params);
  }

  updateUserDetails(firstName: string, lastName: string, email: string, role: UserRole) {
    const url = this.environment.api.userDetails;
    return this.http.post(url, { firstName, lastName, email, role });
  }

  createNewUser(firstName: string, lastName: string, email: string, role: UserRole) {
    const url = this.environment.api.users;
    return this.http.post(url, { firstName, lastName, email, role });
  }

  deleteUser(email: string) {
    const url = `${this.environment.api.users}/${email}`;
    return this.http.delete(url);
  }
}
