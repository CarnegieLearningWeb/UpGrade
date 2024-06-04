import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StratificationFactorsDataService } from './stratification-factors.data.service';
import { Environment } from '../../../environments/environment-types';

class MockHTTPClient {
  get = jest.fn().mockReturnValue(of());
  post = jest.fn().mockReturnValue(of());
  delete = jest.fn().mockReturnValue(of());
  put = jest.fn().mockReturnValue(of());
}

describe('StratificationFactorsDataService', () => {
  let mockHttpClient: any;
  let service: StratificationFactorsDataService;
  let mockStratificationFactorId: string;
  let mockEnvironment: Environment;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    mockEnvironment = { ...environment };
    service = new StratificationFactorsDataService(mockHttpClient as HttpClient, mockEnvironment);

    mockStratificationFactorId = 'stratificationFactorId1';
  });

  describe('#fetchStratificationFactors', () => {
    it('should get the fetchStratificationFactors http observable', () => {
      const expectedUrl = mockEnvironment.api.stratification;

      service.fetchStratificationFactors();

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#importStratificationFactors', () => {
    it('should post the importStratificationFactors http observable', () => {
      const mockStratificationFactors = { files: [{ name: 'factor1' }, { name: 'factor2' }] };
      const expectedUrl = mockEnvironment.api.stratification;

      service.importStratificationFactors(mockStratificationFactors);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, mockStratificationFactors);
    });
  });

  describe('#deleteStratificationFactor', () => {
    it('should get the deleteStratificationFactor http observable', () => {
      const stratificationFactorId = mockStratificationFactorId;
      const expectedUrl = `${mockEnvironment.api.stratification}/${stratificationFactorId}`;

      service.deleteStratificationFactor(stratificationFactorId);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('#exportStratificationFactor', () => {
    it('should get the exportStratificationFactor http observable with responseType text', () => {
      const stratificationFactorId = mockStratificationFactorId;
      const expectedUrl = `${mockEnvironment.api.stratification}/download/${stratificationFactorId}`;

      service.exportStratificationFactor(stratificationFactorId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl, { responseType: 'text' });
    });
  });
});
