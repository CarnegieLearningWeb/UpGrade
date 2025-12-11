import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { VersionService } from './version.service';
import { API_ENDPOINTS } from '../api-endpoints.constants';

class MockHTTPClient {
  get = jest.fn().mockReturnValue(of());
  post = jest.fn().mockReturnValue(of());
  delete = jest.fn().mockReturnValue(of());
  put = jest.fn().mockReturnValue(of());
}

describe('VersionService', () => {
  let service: VersionService;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    service = new VersionService(mockHttpClient as HttpClient);
  });

  describe('getVersion', () => {
    it('should call get with expected url on httpClient and return an observalbe', () => {
      const expectedUrl = API_ENDPOINTS.getVersion;
      const toPromiseSpy = jest.spyOn(Observable.prototype, 'toPromise');

      service.getVersion();

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
      expect(toPromiseSpy).toHaveBeenCalled();
    });
  });
});
