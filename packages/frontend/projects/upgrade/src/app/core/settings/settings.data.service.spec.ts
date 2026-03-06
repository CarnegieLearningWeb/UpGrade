import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { SettingsDataService } from './settings.data.service';
import { SettingParams } from './store/settings.model';
import { API_ENDPOINTS } from '../api-endpoints.constants';

class MockHTTPClient {
  get = jest.fn().mockReturnValue(of());
  post = jest.fn().mockReturnValue(of());
  delete = jest.fn().mockReturnValue(of());
  put = jest.fn().mockReturnValue(of());
}

describe('SettingsDataService', () => {
  let mockHttpClient: any;
  let service: SettingsDataService;
  let mockParams: SettingParams;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    service = new SettingsDataService(mockHttpClient as HttpClient);
    mockParams = {
      toCheckAuth: true,
      toFilterMetric: true,
    };
  });

  describe('#getSettings', () => {
    it('should get the getSettings http observable', () => {
      const expectedUrl = API_ENDPOINTS.setting;

      service.getSettings();

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#setSettings', () => {
    it('should get the setSettings http observable', () => {
      const expectedUrl = API_ENDPOINTS.setting;
      const setting = mockParams;

      service.setSettings(setting);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, setting);
    });
  });
});
