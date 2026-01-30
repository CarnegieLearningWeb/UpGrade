import { Injectable } from '@angular/core';
import { UserRole } from './store/users.model';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../api-endpoints.constants';

@Injectable()
export class UsersDataService {
  constructor(private http: HttpClient) {}

  fetchUsers(params: any) {
    const url = API_ENDPOINTS.getAllUsers;
    return this.http.post(url, params);
  }

  updateUserDetails(firstName: string, lastName: string, email: string, role: UserRole) {
    const url = API_ENDPOINTS.userDetails;
    return this.http.post(url, { firstName, lastName, email, role });
  }

  createNewUser(firstName: string, lastName: string, email: string, role: UserRole) {
    const url = API_ENDPOINTS.users;
    return this.http.post(url, { firstName, lastName, email, role });
  }

  deleteUser(email: string) {
    const url = `${API_ENDPOINTS.users}/${email}`;
    return this.http.delete(url);
  }
}
