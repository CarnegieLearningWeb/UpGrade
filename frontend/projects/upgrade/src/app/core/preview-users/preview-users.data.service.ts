import { Inject, Injectable } from '@angular/core';
import { PreviewUserAssignCondition } from './store/preview-users.model';
import { HttpClient } from '@angular/common/http';
import { ENV, Environment } from '../../../environments/environment-types';

@Injectable()
export class PreviewUsersDataService {
  constructor(private http: HttpClient, @Inject(ENV) private environment: Environment) {}

  fetchPreviewUsers(params: any) {
    const url = this.environment.api.getAllPreviewUsers;
    return this.http.post(url, params);
  }

  addPreviewUser(id: string) {
    const url = this.environment.api.previewUsers;
    return this.http.post(url, { id });
  }

  deletePreviewUser(id: string) {
    const url = `${this.environment.api.previewUsers}/${id}`;
    return this.http.delete(url);
  }

  assignConditionToPreviewUser(data: PreviewUserAssignCondition) {
    const url = this.environment.api.previewUsersAssignCondition;
    return this.http.post(url, data);
  }
}
