import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class ExperimentUsersDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchExcludedUsers() {
    const url = this.environment.api.excludeUsers;
    return this.http.get(url);
  }

  fetchExcludedGroups() {
    const url = this.environment.api.excludeGroups;
    return this.http.get(url);
  }

  excludeUser(id: string) {
    const url = this.environment.api.excludeUsers;
    return this.http.put(url, { id });
  }

  excludeGroup(id: string, type: string) {
    const url = this.environment.api.excludeGroups;
    return this.http.put(url, { id, type });
  }

  deleteExcludedUser(id: string) {
    const url = `${this.environment.api.excludeUsers}/${id}`;
    return this.http.delete(url);
  }

  deleteExcludedGroup(id: string, type: string) {
    const url = `${this.environment.api.excludeGroups}/${type}/${id}`;
    return this.http.delete(url);
  }
}
