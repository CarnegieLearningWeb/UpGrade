import { ThompsonSamplingExperimentCrudService } from '../../../src/api/services/ThompsonSamplingExperimentCrudService';
import { ThompsonSamplingService } from '../../../src/api/services/ThompsonSamplingService';
import { ASSIGNMENT_ALGORITHM, CACHE_PREFIX } from 'upgrade_types';

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
      findByExperimentIdWithConditions: jest.fn().mockResolvedValue(undefined),
    };
    posteriorStateRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    cacheService = { resetPrefixCache: jest.fn().mockResolvedValue(undefined) };

    // Real ThompsonSamplingService — it's a pure, dependency-free service, so using the genuine
    // computePosterior/buildPriorsRecord/estimateConditionWeights implementations here (instead of
    // re-mocking them) keeps this suite honest about what getRewardsSummary/attachConfigToExperiment
    // actually compute.
    service = new ThompsonSamplingExperimentCrudService(
      configRepository,
      posteriorStateRepository,
      new ThompsonSamplingService(),
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

  describe('createConfigIfApplicable', () => {
    it('does nothing for a non-Thompson-Sampling experiment', async () => {
      await service.createConfigIfApplicable(
        { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM } as any,
        {
          id: 'experiment-1',
          conditions: [{ id: 'condition-1' }],
        } as any
      );

      expect(configRepository.save).not.toHaveBeenCalled();
      expect(posteriorStateRepository.save).not.toHaveBeenCalled();
    });

    it('creates a config seeded only from priors/thresholds, never from reward counts, for a newly created/imported experiment', async () => {
      const experiment = {
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        thompsonSamplingConfig: {
          warmupThreshold: 10,
          batchSize: 5,
          priors: { 'condition-1': { success: 7, failure: 4 } },
          // A source experiment (e.g. one carried over via export/import) might still have these
          // fields on it, but ThompsonSamplingConfigParams has no slot for them and createConfig
          // never reads anything but priors/thresholds — so posterior state must still start at 0.
          successCount: 999,
          totalCount: 999,
        },
      } as any;

      await service.createConfigIfApplicable(experiment, {
        id: 'experiment-1',
        conditions: [{ id: 'condition-1' }],
      } as any);

      expect(configRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ experimentId: 'experiment-1', warmupThreshold: 10, batchSize: 5 })
      );
      expect(posteriorStateRepository.save).toHaveBeenCalledWith({
        configId: 'config-1',
        conditionId: 'condition-1',
        priorSuccess: 7,
        priorFailure: 4,
        successCount: 0,
        totalCount: 0,
      });
    });
  });

  describe('syncConfigIfApplicable', () => {
    it('does nothing for a non-Thompson-Sampling experiment', async () => {
      await service.syncConfigIfApplicable(
        { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM } as any,
        {
          id: 'experiment-1',
          conditions: [],
        } as any
      );

      expect(configRepository.findByExperimentId).not.toHaveBeenCalled();
      expect(configRepository.update).not.toHaveBeenCalled();
    });

    it('syncs conditions and applies prior updates for a Thompson Sampling experiment', async () => {
      configRepository.findByExperimentId.mockResolvedValue({
        id: 'config-1',
        conditionPosteriorStates: [{ conditionId: 'condition-1' }],
      });

      const experiment = {
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        thompsonSamplingConfig: { priors: { 'condition-1': { success: 2, failure: 1 } } },
      } as any;

      await service.syncConfigIfApplicable(experiment, {
        id: 'experiment-1',
        conditions: [{ id: 'condition-1' }],
      } as any);

      expect(posteriorStateRepository.update).toHaveBeenCalledWith(
        { configId: 'config-1', conditionId: 'condition-1' },
        { priorSuccess: 2, priorFailure: 1 }
      );
    });
  });

  describe('attachConfigToExperiment', () => {
    it('leaves a non-Thompson-Sampling experiment untouched', async () => {
      const experiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM } as any;

      const result = await service.attachConfigToExperiment(experiment);

      expect(result).toBe(experiment);
      expect(configRepository.findByExperimentId).not.toHaveBeenCalled();
    });

    it('attaches only priors (never accumulated reward counts) for a Thompson Sampling experiment', async () => {
      configRepository.findByExperimentId.mockResolvedValue({
        warmupThreshold: 10,
        minimumDrawDifference: 0.05,
        batchSize: 5,
        conditionPosteriorStates: [
          { conditionId: 'condition-1', priorSuccess: 3, priorFailure: 2, successCount: 40, failureCount: 12 },
        ],
      });

      const experiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING } as any;

      const result = await service.attachConfigToExperiment(experiment);

      expect(result.thompsonSamplingConfig).toEqual({
        warmupThreshold: 10,
        minimumDrawDifference: 0.05,
        batchSize: 5,
        priors: { 'condition-1': { success: 3, failure: 2 } },
      });
    });
  });

  describe('getRewardsSummary', () => {
    it('returns an empty summary when no config exists', async () => {
      const result = await service.getRewardsSummary('experiment-1');

      expect(result).toEqual([]);
      expect(configRepository.findByExperimentIdWithConditions).toHaveBeenCalledWith('experiment-1');
    });

    it('computes alpha/beta from priors + counts and sorts by condition order', async () => {
      configRepository.findByExperimentIdWithConditions.mockResolvedValue({
        conditionPosteriorStates: [
          {
            conditionId: 'condition-2',
            priorSuccess: 1,
            priorFailure: 1,
            successCount: 5,
            failureCount: 5,
            totalCount: 10,
            condition: { conditionCode: 'B', order: 1 },
          },
          {
            conditionId: 'condition-1',
            priorSuccess: 2,
            priorFailure: 3,
            successCount: 8,
            failureCount: 2,
            totalCount: 10,
            condition: { conditionCode: 'A', order: 0 },
          },
        ],
      });

      const result = await service.getRewardsSummary('experiment-1');

      expect(result.map((r) => r.conditionCode)).toEqual(['A', 'B']);
      const [conditionA] = result;
      expect(conditionA).toMatchObject({
        conditionCode: 'A',
        successes: 8,
        failures: 2,
        successRate: '80.0%',
        priorSuccess: 2,
        priorFailure: 3,
      });
    });
  });
});
