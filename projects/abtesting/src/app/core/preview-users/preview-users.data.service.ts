import { Injectable } from '@angular/core';
import { HttpClientService } from '../http/http-client.service';
import { environment } from '../../../environments/environment';
import { PreviewUserAssignCondition } from './store/preview-users.model';

@Injectable()
export class PreviewUsersDataService {
  constructor(
    private http: HttpClientService
  ) {}

  fetchPreviewUsers() {
    const url = environment.api.previewUsers;
    return this.http.get(url);
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
