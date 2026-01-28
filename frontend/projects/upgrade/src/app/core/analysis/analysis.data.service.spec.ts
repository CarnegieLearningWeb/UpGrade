import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AnalysisDataService } from './analysis.data.service';
import { UpsertMetrics } from './store/analysis.models';
import { API_ENDPOINTS } from '../api-endpoints.constants';

class MockHTTPClient {
  get = jest.fn().mockReturnValue(of());
  post = jest.fn().mockReturnValue(of());
  delete = jest.fn().mockReturnValue(of());
}

describe('AnalysisDataService', () => {
  let mockHttpClient: any;
  let service: AnalysisDataService;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    service = new AnalysisDataService(mockHttpClient as HttpClient);
  });

  describe('#fetchMetrics', () => {
    it('should get the fetchMetrics http observable', () => {
      const expectedUrl = API_ENDPOINTS.metrics;

      service.fetchMetrics();

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#upsertMetrics', () => {
    it('should get the upsertMetrics http observable', () => {
      const expectedUrl = API_ENDPOINTS.metricsSave;
      const mockMetrics: UpsertMetrics = {
        metricUnit: [
          {
            key: 'test',
            children: [],
          },
        ],
      };

      service.upsertMetrics(mockMetrics);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, mockMetrics);
    });
  });

  describe('#deleteMetric', () => {
    it('should get the deleteMetric http observable', () => {
      const expectedKey = 'test';
      const expectedUrl = `${API_ENDPOINTS.metrics}/${expectedKey}`;

      service.deleteMetric(expectedKey);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#executeQuery', () => {
    it('should get the executeQuery http observable', () => {
      const expectedQueryIds = ['test', 'values'];
      const expectedUrl = API_ENDPOINTS.queryResult;

      service.executeQuery(expectedQueryIds);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { queryIds: expectedQueryIds });
    });
  });
});
