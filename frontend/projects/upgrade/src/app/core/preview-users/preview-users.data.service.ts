import { Injectable } from '@angular/core';
import { PreviewUserAssignCondition } from './store/preview-users.model';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../api-endpoints.constants';

@Injectable()
export class PreviewUsersDataService {
  constructor(private http: HttpClient) {}

  fetchPreviewUsers(params: any) {
    const url = API_ENDPOINTS.getAllPreviewUsers;
    return this.http.post(url, params);
  }

  addPreviewUser(id: string) {
    const url = API_ENDPOINTS.previewUsers;
    return this.http.post(url, { id });
  }

  deletePreviewUser(id: string) {
    const url = `${API_ENDPOINTS.previewUsers}/${id}`;
    return this.http.delete(url);
  }

  assignConditionToPreviewUser(data: PreviewUserAssignCondition) {
    const url = API_ENDPOINTS.previewUsersAssignCondition;
    return this.http.post(url, data);
  }
}
