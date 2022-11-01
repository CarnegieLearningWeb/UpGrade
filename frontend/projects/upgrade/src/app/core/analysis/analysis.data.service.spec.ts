import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment-types';
import { AnalysisDataService } from './analysis.data.service';
import { UpsertMetrics } from './store/analysis.models';

class MockHTTPClient {
  get = jest.fn().mockReturnValue(of());
  post = jest.fn().mockReturnValue(of());
  delete = jest.fn().mockReturnValue(of());
}

describe('AnalysisDataService', () => {
  let mockHttpClient: any;
  let mockEnvironment: Environment;
  let service: AnalysisDataService;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    mockEnvironment = { ...environment };
    service = new AnalysisDataService(mockHttpClient as HttpClient, mockEnvironment);
  });

  describe('#fetchMetrics', () => {
    it('should get the fetchMetrics http observable', () => {
      const expectedUrl = mockEnvironment.api.metrics;

      service.fetchMetrics();

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#upsertMetrics', () => {
    it('should get the upsertMetrics http observable', () => {
      const expectedUrl = mockEnvironment.api.metricsSave;
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
      const expectedUrl = `${mockEnvironment.api.metrics}/${expectedKey}`;

      service.deleteMetric(expectedKey);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#executeQuery', () => {
    it('should get the executeQuery http observable', () => {
      const expectedQueryIds = ['test', 'values'];
      const expectedUrl = mockEnvironment.api.queryResult;

      service.executeQuery(expectedQueryIds);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { queryIds: expectedQueryIds });
    });
  });
});
