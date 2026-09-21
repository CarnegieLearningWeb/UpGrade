import { HttpClient, HttpContext } from '@angular/common/http';
import { of } from 'rxjs';
import { FeatureFlagsDataService } from './feature-flags.data.service';
import { API_ENDPOINTS } from '../api-endpoints.constants';
import { HANDLES_404_CONTEXTUALLY } from '../http-interceptors/http-context-tokens';

class MockHTTPClient {
  get = jest.fn().mockReturnValue(of());
}

describe('FeatureFlagsDataService', () => {
  let mockHttpClient: any;
  let service: FeatureFlagsDataService;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    service = new FeatureFlagsDataService(mockHttpClient as HttpClient);
  });

  describe('#fetchFeatureFlagById', () => {
    it('should fetch the feature flag observable with contextual 404 handling', () => {
      const flagId = 'flagId1';
      const expectedUrl = `${API_ENDPOINTS.featureFlag}/${flagId}`;

      service.fetchFeatureFlagById(flagId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl, { context: expect.any(HttpContext) });
      const context: HttpContext = (mockHttpClient.get as jest.Mock).mock.calls[0][1].context;
      expect(context.get(HANDLES_404_CONTEXTUALLY)).toBe(true);
    });
  });
});
