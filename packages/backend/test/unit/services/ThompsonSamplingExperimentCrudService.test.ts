import { ThompsonSamplingExperimentCrudService } from '../../../src/api/services/ThompsonSamplingExperimentCrudService';
import { CACHE_PREFIX } from 'upgrade_types';

describe('ThompsonSamplingExperimentCrudService', () => {
  let configRepository: any;
  let posteriorStateRepository: any;
  let cacheService: any;
  let service: ThompsonSamplingExperimentCrudService;

  beforeEach(() => {
    configRepository = {
      save: jest.fn().mockResolvedValue({ id: 'config-1', experimentId: 'experiment-1' }),
      update: jest.fn().mockResolvedValue(undefined),
      findByExperimentId: jest.fn().mockResolvedValue(undefined),
    };
    posteriorStateRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    cacheService = { resetPrefixCache: jest.fn().mockResolvedValue(undefined) };

    service = new ThompsonSamplingExperimentCrudService(
      configRepository,
      posteriorStateRepository,
      {} as any,
      cacheService
    );
  });

  describe('config cache invalidation', () => {
    it('resets the Thompson Sampling config cache prefix after creating a config', async () => {
      await service.createConfig('experiment-1', [{ id: 'condition-1' }]);

      expect(cacheService.resetPrefixCache).toHaveBeenCalledWith(CACHE_PREFIX.THOMPSON_SAMPLING_CONFIG_KEY_PREFIX);
    });

    it('resets the Thompson Sampling config cache prefix after updating a config', async () => {
      await service.updateConfig('experiment-1', { batchSize: 5 });

      expect(cacheService.resetPrefixCache).toHaveBeenCalledWith(CACHE_PREFIX.THOMPSON_SAMPLING_CONFIG_KEY_PREFIX);
    });

    it('resets the cache even when updating priors (a second, later write in updateConfig)', async () => {
      configRepository.findByExperimentId.mockResolvedValue({
        id: 'config-1',
        conditionPosteriorStates: [{ conditionId: 'condition-1' }],
      });

      await service.updateConfig('experiment-1', { priors: { 'condition-1': { success: 3, failure: 2 } } });

      expect(cacheService.resetPrefixCache).toHaveBeenCalledWith(CACHE_PREFIX.THOMPSON_SAMPLING_CONFIG_KEY_PREFIX);
      expect(posteriorStateRepository.update).toHaveBeenCalledWith(
        { configId: 'config-1', conditionId: 'condition-1' },
        { priorSuccess: 3, priorFailure: 2 }
      );
    });
  });
});
