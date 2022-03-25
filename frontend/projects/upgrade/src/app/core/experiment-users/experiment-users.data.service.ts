import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class ExperimentUsersDataService {
  constructor(private http: HttpClient) {}

  fetchExcludedUsers() {
    const url = environment.api.excludeUsers;
    return this.http.get(url);
  }

  fetchExcludedGroups() {
    const url = environment.api.excludeGroups;
    return this.http.get(url);
  }

  excludeUser(userIds: string[]) {
    const url = environment.api.excludeUsers;
    return this.http.post(url, { userIds });
  }

  excludeGroup(groups: Array<{groupId: string, type: string}>) {
    const url = environment.api.excludeGroups;
    return this.http.post(url, { groups });
  }

  deleteExcludedUser(id: string) {
    const url = `${environment.api.excludeUsers}/${id}`;
    return this.http.delete(url);
  }

  deleteExcludedGroup(id: string, type: string) {
    const url = `${environment.api.excludeGroups}/${type}/${id}`;
    return this.http.delete(url);
  }
}
