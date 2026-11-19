import { ThompsonSamplingExperimentCrudService } from '../../../src/api/services/ThompsonSamplingExperimentCrudService';
import { ThompsonSamplingService } from '../../../src/api/services/ThompsonSamplingService';
import { ASSIGNMENT_ALGORITHM, CACHE_PREFIX } from 'upgrade_types';

describe('ThompsonSamplingExperimentCrudService', () => {
  let configRepository: any;
  let posteriorStateRepository: any;
  let rewardRepository: any;
  let cacheService: any;
  let service: ThompsonSamplingExperimentCrudService;

  beforeEach(() => {
    configRepository = {
      save: jest.fn().mockResolvedValue({ id: 'config-1', experimentId: 'experiment-1' }),
      update: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      findByExperimentId: jest.fn().mockResolvedValue(undefined),
      findByExperimentIdWithConditions: jest.fn().mockResolvedValue(undefined),
    };
    posteriorStateRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    rewardRepository = {
      countByConditionIds: jest.fn().mockResolvedValue(0),
      countOutcomesByConditionInArrivalRange: jest.fn().mockResolvedValue([]),
      findByConditionIdsInArrivalOrder: jest.fn().mockResolvedValue([]),
    };
    cacheService = { resetPrefixCache: jest.fn().mockResolvedValue(undefined) };

    // Real ThompsonSamplingService — it's a pure, dependency-free service, so using the genuine
    // computePosterior/buildPriorsRecord/estimateConditionWeights implementations here (instead of
    // re-mocking them) keeps this suite honest about what getRewardsSummary/attachConfigToExperiment
    // actually compute.
    service = new ThompsonSamplingExperimentCrudService(
      configRepository,
      posteriorStateRepository,
      rewardRepository,
      new ThompsonSamplingService(),
      cacheService
    );
  });

  describe('createConfig', () => {
    it('defaults scalingFactor to 1 (no scaling) when the caller does not provide one', async () => {
      await service.createConfig('experiment-1', [{ id: 'condition-1' }]);

      expect(configRepository.save).toHaveBeenCalledWith(expect.objectContaining({ scalingFactor: 1 }));
    });
  });

  describe('getRewardsReplay', () => {
    it('returns empty lists and default config when the experiment has no Thompson Sampling config', async () => {
      const replay = await service.getRewardsReplay('experiment-1');

      expect(replay).toEqual({
        conditions: [],
        rewards: [],
        earlierRewardCount: 0,
        batchSize: 1,
        warmupThreshold: 0,
        minimumDrawDifference: 0,
        scalingFactor: 1,
      });
      expect(rewardRepository.findByConditionIdsInArrivalOrder).not.toHaveBeenCalled();
    });

    it('returns conditions in display order with codes and priors, rewards oldest first, and the config', async () => {
      configRepository.findByExperimentIdWithConditions.mockResolvedValue({
        batchSize: 5,
        warmupThreshold: 10,
        minimumDrawDifference: 0.05,
        scalingFactor: 0.25,
        conditionPosteriorStates: [
          { conditionId: 'condition-b', priorSuccess: 1, priorFailure: 1, condition: { conditionCode: 'B', order: 2 } },
          { conditionId: 'condition-a', priorSuccess: 3, priorFailure: 2, condition: { conditionCode: 'A', order: 1 } },
        ],
      });
      rewardRepository.countByConditionIds.mockResolvedValue(2);
      rewardRepository.findByConditionIdsInArrivalOrder.mockResolvedValue([
        { id: 'reward-1', conditionId: 'condition-a', success: true, createdAt: new Date('2026-10-27T12:03:19.222Z') },
        { id: 'reward-2', conditionId: 'condition-b', success: false, createdAt: new Date('2026-10-27T12:05:00.772Z') },
      ]);

      const replay = await service.getRewardsReplay('experiment-1');

      expect(rewardRepository.findByConditionIdsInArrivalOrder).toHaveBeenCalledWith(['condition-a', 'condition-b'], 0);
      const noEarlierRewards = { successes: 0, failures: 0, pendingSuccesses: 0, pendingFailures: 0 };
      expect(replay).toEqual({
        conditions: [
          {
            conditionId: 'condition-a',
            conditionCode: 'A',
            order: 1,
            priorSuccess: 3,
            priorFailure: 2,
            earlierRewards: noEarlierRewards,
          },
          {
            conditionId: 'condition-b',
            conditionCode: 'B',
            order: 2,
            priorSuccess: 1,
            priorFailure: 1,
            earlierRewards: noEarlierRewards,
          },
        ],
        rewards: [
          { conditionId: 'condition-a', success: true, createdAt: '2026-10-27T12:03:19.222Z' },
          { conditionId: 'condition-b', success: false, createdAt: '2026-10-27T12:05:00.772Z' },
        ],
        earlierRewardCount: 0,
        batchSize: 5,
        warmupThreshold: 10,
        minimumDrawDifference: 0.05,
        scalingFactor: 0.25,
      });
    });

    it('never passes a user id through to the replay, even if a reward row carries one', async () => {
      configRepository.findByExperimentIdWithConditions.mockResolvedValue({
        batchSize: 1,
        warmupThreshold: 0,
        minimumDrawDifference: 0,
        conditionPosteriorStates: [
          { conditionId: 'condition-a', priorSuccess: 1, priorFailure: 1, condition: { conditionCode: 'A', order: 1 } },
        ],
      });
      rewardRepository.findByConditionIdsInArrivalOrder.mockResolvedValue([
        {
          id: 'reward-1',
          conditionId: 'condition-a',
          userId: 'user-1',
          success: true,
          createdAt: new Date('2026-10-27T12:03:19.222Z'),
        },
      ]);

      const replay = await service.getRewardsReplay('experiment-1');

      expect(replay.rewards).toHaveLength(1);
      expect(replay.rewards[0]).not.toHaveProperty('userId');
    });

    it('falls back to the condition id when a condition has no code', async () => {
      configRepository.findByExperimentIdWithConditions.mockResolvedValue({
        batchSize: 1,
        warmupThreshold: 0,
        minimumDrawDifference: 0,
        conditionPosteriorStates: [
          {
            conditionId: 'condition-a',
            priorSuccess: 1,
            priorFailure: 1,
            condition: { conditionCode: null, order: 1 },
          },
        ],
      });

      const replay = await service.getRewardsReplay('experiment-1');

      expect(replay.conditions[0].conditionCode).toBe('condition-a');
    });

    it('replays only the most recent 1,000 rewards and counts older ones, splitting off an open batch', async () => {
      configRepository.findByExperimentIdWithConditions.mockResolvedValue({
        batchSize: 2,
        warmupThreshold: 0,
        minimumDrawDifference: 0,
        scalingFactor: 1,
        conditionPosteriorStates: [
          { conditionId: 'condition-a', priorSuccess: 1, priorFailure: 1, condition: { conditionCode: 'A', order: 1 } },
          { conditionId: 'condition-b', priorSuccess: 1, priorFailure: 1, condition: { conditionCode: 'B', order: 2 } },
        ],
      });
      // 1,003 rewards: the oldest 3 aren't replayed. With batchSize 2, the first 2 of those were one
      // applied batch and the 3rd was still buffered when the replayed rewards begin.
      rewardRepository.countByConditionIds.mockResolvedValue(1003);
      rewardRepository.countOutcomesByConditionInArrivalRange.mockImplementation(async (_ids, first) =>
        first === 1
          ? [
              { conditionId: 'condition-a', successes: 1, failures: 0 },
              { conditionId: 'condition-b', successes: 0, failures: 1 },
            ]
          : [{ conditionId: 'condition-b', successes: 1, failures: 0 }]
      );

      const replay = await service.getRewardsReplay('experiment-1');

      const ids = ['condition-a', 'condition-b'];
      expect(rewardRepository.countOutcomesByConditionInArrivalRange).toHaveBeenCalledWith(ids, 1, 2);
      expect(rewardRepository.countOutcomesByConditionInArrivalRange).toHaveBeenCalledWith(ids, 3, 3);
      expect(rewardRepository.findByConditionIdsInArrivalOrder).toHaveBeenCalledWith(ids, 3);
      expect(replay.earlierRewardCount).toBe(3);
      expect(replay.conditions.map((condition) => condition.earlierRewards)).toEqual([
        { successes: 1, failures: 0, pendingSuccesses: 0, pendingFailures: 0 },
        { successes: 0, failures: 1, pendingSuccesses: 1, pendingFailures: 0 },
      ]);
    });
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
        { conditionId: 'condition-1' },
        { priorSuccess: 3, priorFailure: 2 }
      );
    });
  });

  describe('updateConfig', () => {
    it('only writes fields the caller actually provided, leaving omitted fields untouched', async () => {
      await service.updateConfig('experiment-1', { batchSize: 5 });

      expect(configRepository.update).toHaveBeenCalledWith({ experimentId: 'experiment-1' }, { batchSize: 5 });
    });

    it('writes scalingFactor when provided, so it can be edited on a running experiment', async () => {
      await service.updateConfig('experiment-1', { scalingFactor: 0.25 });

      expect(configRepository.update).toHaveBeenCalledWith({ experimentId: 'experiment-1' }, { scalingFactor: 0.25 });
      expect(cacheService.resetPrefixCache).toHaveBeenCalledWith(CACHE_PREFIX.THOMPSON_SAMPLING_CONFIG_KEY_PREFIX);
    });

    it('does not issue an update call at all when no threshold/batchSize fields are provided', async () => {
      await service.updateConfig('experiment-1', { priors: { 'condition-1': { success: 1, failure: 1 } } });

      expect(configRepository.update).not.toHaveBeenCalled();
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
          scalingFactor: 0.5,
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
        expect.objectContaining({ experimentId: 'experiment-1', scalingFactor: 0.5, warmupThreshold: 10, batchSize: 5 })
      );
      expect(posteriorStateRepository.save).toHaveBeenCalledWith({
        conditionId: 'condition-1',
        priorSuccess: 7,
        priorFailure: 4,
        successCount: 0,
        totalCount: 0,
      });
    });

    it('remaps priors keyed by pre-creation condition ids onto the actual created condition ids', async () => {
      // ExperimentService.create()/deduceConditions() regenerate every condition id in place, so the
      // client-submitted (or previously-exported) ids the priors record is keyed by never match
      // createdExperiment.conditions[].id on their own -- without originalConditionIds to remap
      // through, this would silently fall back to the default Beta(1,1) prior for every condition.
      const experiment = {
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        thompsonSamplingConfig: {
          priors: {
            'client-temp-id-1': { success: 7, failure: 4 },
            'client-temp-id-2': { success: 3, failure: 9 },
          },
        },
      } as any;

      await service.createConfigIfApplicable(
        experiment,
        {
          id: 'experiment-1',
          conditions: [{ id: 'server-id-1' }, { id: 'server-id-2' }],
        } as any,
        ['client-temp-id-1', 'client-temp-id-2']
      );

      expect(posteriorStateRepository.save).toHaveBeenCalledWith({
        conditionId: 'server-id-1',
        priorSuccess: 7,
        priorFailure: 4,
        successCount: 0,
        totalCount: 0,
      });
      expect(posteriorStateRepository.save).toHaveBeenCalledWith({
        conditionId: 'server-id-2',
        priorSuccess: 3,
        priorFailure: 9,
        successCount: 0,
        totalCount: 0,
      });
    });

    it('falls back to default priors when originalConditionIds is not provided', async () => {
      const experiment = {
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        thompsonSamplingConfig: { priors: { 'client-temp-id-1': { success: 7, failure: 4 } } },
      } as any;

      await service.createConfigIfApplicable(experiment, {
        id: 'experiment-1',
        conditions: [{ id: 'server-id-1' }],
      } as any);

      expect(posteriorStateRepository.save).toHaveBeenCalledWith({
        conditionId: 'server-id-1',
        priorSuccess: 1,
        priorFailure: 1,
        successCount: 0,
        totalCount: 0,
      });
    });
  });

  describe('syncConfigIfApplicable', () => {
    it('does nothing for a non-Thompson-Sampling experiment with no existing config', async () => {
      await service.syncConfigIfApplicable(
        { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM } as any,
        {
          id: 'experiment-1',
          conditions: [],
        } as any
      );

      expect(configRepository.remove).not.toHaveBeenCalled();
      expect(configRepository.update).not.toHaveBeenCalled();
    });

    it('deletes a stale config left over from before the experiment switched away from Thompson Sampling', async () => {
      const staleConfig = { id: 'config-1', conditionPosteriorStates: [{ conditionId: 'condition-1' }] };
      configRepository.findByExperimentId.mockResolvedValue(staleConfig);

      await service.syncConfigIfApplicable(
        { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM } as any,
        {
          id: 'experiment-1',
          conditions: [],
        } as any
      );

      expect(configRepository.remove).toHaveBeenCalledWith(staleConfig);
      expect(cacheService.resetPrefixCache).toHaveBeenCalledWith(CACHE_PREFIX.THOMPSON_SAMPLING_CONFIG_KEY_PREFIX);
    });

    it('creates a config when an experiment is switched to Thompson Sampling on an update rather than at create time', async () => {
      configRepository.findByExperimentId.mockResolvedValue(undefined);

      const experiment = {
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        thompsonSamplingConfig: { batchSize: 5, priors: { 'condition-1': { success: 2, failure: 1 } } },
      } as any;

      await service.syncConfigIfApplicable(experiment, {
        id: 'experiment-1',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'condition-1' }],
      } as any);

      expect(configRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ experimentId: 'experiment-1', batchSize: 5 })
      );
      expect(posteriorStateRepository.save).toHaveBeenCalledWith({
        conditionId: 'condition-1',
        priorSuccess: 2,
        priorFailure: 1,
        successCount: 0,
        totalCount: 0,
      });
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
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'condition-1' }],
      } as any);

      expect(posteriorStateRepository.update).toHaveBeenCalledWith(
        { conditionId: 'condition-1' },
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
        scalingFactor: 0.2,
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
        scalingFactor: 0.2,
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

      expect(result).toEqual({
        conditions: [],
        pendingRewardsCount: 0,
        totalRewardCount: 0,
        warmupThreshold: 0,
        batchSize: 1,
        scalingFactor: 1,
      });
      expect(configRepository.findByExperimentIdWithConditions).toHaveBeenCalledWith('experiment-1');
    });

    it('computes alpha/beta from priors + counts and sorts by condition order', async () => {
      configRepository.findByExperimentIdWithConditions.mockResolvedValue({
        warmupThreshold: 100,
        batchSize: 1,
        conditionPosteriorStates: [
          {
            conditionId: 'condition-2',
            priorSuccess: 1,
            priorFailure: 1,
            successCount: 5,
            failureCount: 5,
            totalCount: 10,
            pendingTotalCount: 0,
            condition: { conditionCode: 'B', order: 1 },
          },
          {
            conditionId: 'condition-1',
            priorSuccess: 2,
            priorFailure: 3,
            successCount: 8,
            failureCount: 2,
            totalCount: 10,
            pendingTotalCount: 0,
            condition: { conditionCode: 'A', order: 0 },
          },
        ],
      });

      const result = await service.getRewardsSummary('experiment-1');

      expect(result.conditions.map((r) => r.conditionCode)).toEqual(['A', 'B']);
      const [conditionA] = result.conditions;
      expect(conditionA).toMatchObject({
        conditionCode: 'A',
        successes: 8,
        failures: 2,
        successRate: '80.0%',
        priorSuccess: 2,
        priorFailure: 3,
        successPosterior: 10,
        failurePosterior: 5,
      });
      expect(result.totalRewardCount).toBe(20);
      expect(result.warmupThreshold).toBe(100);
      expect(result.batchSize).toBe(1);
    });

    it('scales counts (not priors or raw counts) by scalingFactor in the posteriors and estimated weights', async () => {
      configRepository.findByExperimentIdWithConditions.mockResolvedValue({
        warmupThreshold: 0,
        batchSize: 1,
        scalingFactor: 0.2,
        conditionPosteriorStates: [
          {
            conditionId: 'condition-1',
            priorSuccess: 1,
            priorFailure: 1,
            successCount: 100,
            failureCount: 0,
            totalCount: 100,
            pendingTotalCount: 0,
            condition: { conditionCode: 'A', order: 0 },
          },
          {
            conditionId: 'condition-2',
            priorSuccess: 1,
            priorFailure: 1,
            successCount: 0,
            failureCount: 0,
            totalCount: 0,
            pendingTotalCount: 0,
            condition: { conditionCode: 'B', order: 1 },
          },
        ],
      });

      const result = await service.getRewardsSummary('experiment-1');

      expect(result.scalingFactor).toBe(0.2);
      expect(result.conditions[0]).toMatchObject({
        successes: 100,
        failures: 0,
        successPosterior: 21,
        failurePosterior: 1,
      });
      expect(result.conditions[1]).toMatchObject({ successPosterior: 1, failurePosterior: 1 });
      // Beta(21, 1) vs Beta(1, 1): A wins a draw ~95% of the time, so it still dominates.
      expect(result.conditions[0].estimatedWeight).toBeGreaterThan(85);
    });

    it('keys weight estimation by conditionId, not conditionCode, so two conditions sharing a code do not collide', async () => {
      // conditionCode has no uniqueness constraint -- give both conditions the same one, but with
      // vastly different posteriors, so a code-keyed weight map (the bug) would collapse them into
      // a single shared value instead of each reflecting its own evidence.
      configRepository.findByExperimentIdWithConditions.mockResolvedValue({
        warmupThreshold: 0,
        batchSize: 1,
        conditionPosteriorStates: [
          {
            conditionId: 'condition-1',
            priorSuccess: 1000,
            priorFailure: 1,
            successCount: 0,
            failureCount: 0,
            totalCount: 0,
            pendingTotalCount: 0,
            condition: { conditionCode: 'DUPLICATE', order: 0 },
          },
          {
            conditionId: 'condition-2',
            priorSuccess: 1,
            priorFailure: 1000,
            successCount: 0,
            failureCount: 0,
            totalCount: 0,
            pendingTotalCount: 0,
            condition: { conditionCode: 'DUPLICATE', order: 1 },
          },
        ],
      });

      const {
        conditions: [strong, weak],
      } = await service.getRewardsSummary('experiment-1');

      expect(strong.estimatedWeight).toBeGreaterThan(90);
      expect(weak.estimatedWeight).toBeLessThan(10);
    });

    it('sums pendingTotalCount across conditions when batchSize > 1', async () => {
      configRepository.findByExperimentIdWithConditions.mockResolvedValue({
        warmupThreshold: 0,
        batchSize: 5,
        conditionPosteriorStates: [
          {
            conditionId: 'condition-1',
            priorSuccess: 1,
            priorFailure: 1,
            successCount: 0,
            failureCount: 0,
            totalCount: 0,
            pendingTotalCount: 2,
            condition: { conditionCode: 'A', order: 0 },
          },
          {
            conditionId: 'condition-2',
            priorSuccess: 1,
            priorFailure: 1,
            successCount: 0,
            failureCount: 0,
            totalCount: 0,
            pendingTotalCount: 1,
            condition: { conditionCode: 'B', order: 1 },
          },
        ],
      });

      const result = await service.getRewardsSummary('experiment-1');

      expect(result.pendingRewardsCount).toBe(3);
      expect(result.totalRewardCount).toBe(3);
    });

    it('reports per-condition totalRewardCount as flushed + pending, summing to the summary total', async () => {
      configRepository.findByExperimentIdWithConditions.mockResolvedValue({
        warmupThreshold: 0,
        batchSize: 5,
        conditionPosteriorStates: [
          {
            conditionId: 'condition-1',
            priorSuccess: 1,
            priorFailure: 1,
            successCount: 4,
            failureCount: 2,
            totalCount: 6,
            pendingTotalCount: 2,
            condition: { conditionCode: 'A', order: 0 },
          },
          {
            conditionId: 'condition-2',
            priorSuccess: 1,
            priorFailure: 1,
            successCount: 1,
            failureCount: 3,
            totalCount: 4,
            pendingTotalCount: 1,
            condition: { conditionCode: 'B', order: 1 },
          },
        ],
      });

      const result = await service.getRewardsSummary('experiment-1');

      // A pending batch hasn't reached successes/failures yet, so totalRewardCount runs ahead of them.
      expect(result.conditions.map((c) => c.totalRewardCount)).toEqual([8, 5]);
      expect(result.conditions[0].successes + result.conditions[0].failures).toBe(6);
      expect(result.totalRewardCount).toBe(13);
    });

    it('always reports 0 pending rewards when batchSize is 1, even if a row has a stale pendingTotalCount', async () => {
      configRepository.findByExperimentIdWithConditions.mockResolvedValue({
        warmupThreshold: 0,
        batchSize: 1,
        conditionPosteriorStates: [
          {
            conditionId: 'condition-1',
            priorSuccess: 1,
            priorFailure: 1,
            successCount: 0,
            failureCount: 0,
            totalCount: 0,
            pendingTotalCount: 3,
            condition: { conditionCode: 'A', order: 0 },
          },
        ],
      });

      const result = await service.getRewardsSummary('experiment-1');

      expect(result.pendingRewardsCount).toBe(0);
    });
  });
});
