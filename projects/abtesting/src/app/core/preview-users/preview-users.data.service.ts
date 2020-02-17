import { Injectable } from '@angular/core';
import { HttpClientService } from '../http/http-client.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class PreviewUsersDataService {
  constructor(
    private http: HttpClientService
  ) {}

  fetchPreviewUsers() {
    const url = environment.api.previewUsers;
    return this.http.get(url);
  }

  addPreviewUser(id: string, group: any) {
    const url = environment.api.previewUsers;
    return this.http.post(url, { id, group });
  }

  deletePreviewUser(id: string) {
    const url = `${environment.api.previewUsers}/${id}`;
    return this.http.delete(url);
  }
}
