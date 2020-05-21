import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PreviewUserAssignCondition } from './store/preview-users.model';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class PreviewUsersDataService {
  constructor(
    private http: HttpClient
  ) {}

  fetchPreviewUsers(params: any) {
    const url = environment.api.getAllPreviewUsers;
    return this.http.post(url, params);
  }

  addPreviewUser(id: string) {
    const url = environment.api.previewUsers;
    return this.http.post(url, { id });
  }

  deletePreviewUser(id: string) {
    const url = `${environment.api.previewUsers}/${id}`;
    return this.http.delete(url);
  }

  assignConditionToPreviewUser(data: PreviewUserAssignCondition) {
    const url = environment.api.previewUsersAssignCondition;
    return this.http.post(url, data);
  }
}
