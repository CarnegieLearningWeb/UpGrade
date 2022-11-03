import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment-types';
import { VersionService } from './version.service';

class MockHTTPClient {
  get = jest.fn().mockReturnValue(of());
  post = jest.fn().mockReturnValue(of());
  delete = jest.fn().mockReturnValue(of());
  put = jest.fn().mockReturnValue(of());
}

describe('VersionService', () => {
  let service: VersionService;
  let mockHttpClient: any;
  let mockEnvironment: Environment;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    mockEnvironment = { ...environment };
    service = new VersionService(mockHttpClient as HttpClient, mockEnvironment);
  });

  describe('getVersion', () => {
    it('should call get with expected url on httpClient and return an observalbe', () => {
      const expectedUrl = mockEnvironment.api.getVersion;
      const toPromiseSpy = jest.spyOn(Observable.prototype, 'toPromise');

      service.getVersion();

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
      expect(toPromiseSpy).toHaveBeenCalled();
    });
  });
});
