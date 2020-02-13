import { Injectable } from '@angular/core';
import { HttpClientService } from '../http/http-client.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class ExperimentUsersDataService {
  constructor(
    private http: HttpClientService
  ) {}

  fetchExcludedUsers() {
    const url = environment.api.excludeUsers;
    return this.http.get(url);
  }

  fetchExcludedGroups() {
    const url = environment.api.excludeGroups;
    return this.http.get(url);
  }

  excludeUser(id: string) {
    const url = environment.api.excludeUsers;
    return this.http.put(url, { id });
  }

  excludeGroup(id: string, type: string) {
    const url = environment.api.excludeGroups;
    return this.http.put(url, { id, type } );
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
