import { Test, TestingModule } from '@nestjs/testing';
import {
  ThompsonSamplingService,
  ConditionRewardSummary,
  ThompsonSamplingConfig,
  DEFAULT_PRIOR,
} from '../../../src/api/services/ThompsonSamplingService';
import { configureLogger } from '../../utils/logger';

describe('ThompsonSamplingService', () => {
  let service: ThompsonSamplingService;

  beforeAll(() => {
    configureLogger();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThompsonSamplingService],
    }).compile();

    service = module.get<ThompsonSamplingService>(ThompsonSamplingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('selectCondition', () => {
    it('throws when given an empty condition list', () => {
      expect(() => service.selectCondition([], [], 0)).toThrow();
    });

    it('returns the only condition when list has one entry', () => {
      expect(service.selectCondition(['A'], [], 10)).toBe('A');
    });

    it('always returns a valid condition code', () => {
      const conditions = ['A', 'B', 'C'];
      for (let i = 0; i < 30; i++) {
        expect(conditions).toContain(service.selectCondition(conditions, [], 100));
      }
    });

    describe('warmup phase', () => {
      it('uses uniform random during warmup — both conditions appear across 50 draws', () => {
        const conditions = ['A', 'B'];
        // A has an overwhelmingly dominant posterior; without warmup it would always win
        const rewardSummaries: ConditionRewardSummary[] = [
          { conditionCode: 'A', successCount: 1000, totalCount: 1000 },
          { conditionCode: 'B', successCount: 0, totalCount: 1000 },
        ];
        const config: ThompsonSamplingConfig = { warmupThreshold: 50 };

        const results = new Set<string>();
        for (let i = 0; i < 50; i++) {
          results.add(service.selectCondition(conditions, rewardSummaries, 5, config));
        }
        expect(results.has('A')).toBe(true);
        expect(results.has('B')).toBe(true);
      });

      it('exits warmup once enrollment exceeds threshold', () => {
        const conditions = ['A', 'B'];
        const rewardSummaries: ConditionRewardSummary[] = [
          { conditionCode: 'A', successCount: 1000, totalCount: 1000 },
          { conditionCode: 'B', successCount: 0, totalCount: 1000 },
        ];
        const config: ThompsonSamplingConfig = { warmupThreshold: 10 };

        let aCount = 0;
        const runs = 100;
        for (let i = 0; i < runs; i++) {
          if (service.selectCondition(conditions, rewardSummaries, 100, config) === 'A') {
            aCount++;
          }
        }
        // After warmup, A's dominant posterior should win nearly every draw
        expect(aCount / runs).toBeGreaterThan(0.95);
      });
    });

    describe('Thompson Sampling selection', () => {
      it('selects the condition with a better reward history reliably', () => {
        const conditions = ['good', 'bad'];
        const rewardSummaries: ConditionRewardSummary[] = [
          { conditionCode: 'good', successCount: 90, totalCount: 100 },
          { conditionCode: 'bad', successCount: 10, totalCount: 100 },
        ];

        let goodCount = 0;
        const runs = 500;
        for (let i = 0; i < runs; i++) {
          if (service.selectCondition(conditions, rewardSummaries, runs) === 'good') {
            goodCount++;
          }
        }
        expect(goodCount / runs).toBeGreaterThan(0.9);
      });

      it('handles three or more conditions — clear winner dominates', () => {
        const conditions = ['A', 'B', 'C', 'D'];
        const rewardSummaries: ConditionRewardSummary[] = [
          { conditionCode: 'A', successCount: 5, totalCount: 100 },
          { conditionCode: 'B', successCount: 90, totalCount: 100 },
          { conditionCode: 'C', successCount: 10, totalCount: 100 },
          { conditionCode: 'D', successCount: 5, totalCount: 100 },
        ];

        let bCount = 0;
        const runs = 500;
        for (let i = 0; i < runs; i++) {
          if (service.selectCondition(conditions, rewardSummaries, runs) === 'B') {
            bCount++;
          }
        }
        expect(bCount / runs).toBeGreaterThan(0.8);
      });

      it('respects strong priors when no rewards have been collected', () => {
        const conditions = ['A', 'B'];
        const config: ThompsonSamplingConfig = {
          priors: {
            A: { success: 100, failure: 1 },
            B: { success: 1, failure: 100 },
          },
        };

        let aCount = 0;
        const runs = 100;
        for (let i = 0; i < runs; i++) {
          if (service.selectCondition(conditions, [], 0, config) === 'A') {
            aCount++;
          }
        }
        expect(aCount / runs).toBeGreaterThan(0.95);
      });

      it('uses DEFAULT_PRIOR for conditions missing a prior entry', () => {
        const conditions = ['A', 'B'];
        const config: ThompsonSamplingConfig = {
          priors: {
            A: { success: 100, failure: 1 }, // strong prior for A
            // B intentionally absent — should use DEFAULT_PRIOR Beta(1,1)
          },
        };

        let aCount = 0;
        const runs = 100;
        for (let i = 0; i < runs; i++) {
          if (service.selectCondition(conditions, [], 0, config) === 'A') {
            aCount++;
          }
        }
        expect(aCount / runs).toBeGreaterThan(0.9);
      });

      it('handles a condition with no reward summary entry (defaults to prior)', () => {
        const conditions = ['A', 'B'];
        const rewardSummaries: ConditionRewardSummary[] = [
          { conditionCode: 'A', successCount: 50, totalCount: 100 },
          // B has no entry — treated as zero rewards, uses prior only
        ];

        for (let i = 0; i < 20; i++) {
          expect(conditions).toContain(service.selectCondition(conditions, rewardSummaries, 200));
        }
      });
    });

    describe('minimumDrawDifference', () => {
      it('falls back to uniform when threshold is larger than any possible draw difference', () => {
        const conditions = ['A', 'B'];
        // Threshold of 2 always triggers since Beta draws are in [0,1]
        const config: ThompsonSamplingConfig = { minimumDrawDifference: 2 };

        const results = new Set<string>();
        for (let i = 0; i < 50; i++) {
          results.add(service.selectCondition(conditions, [], 100, config));
        }
        expect(results.has('A')).toBe(true);
        expect(results.has('B')).toBe(true);
      });

      it('does not interfere when threshold is zero', () => {
        const conditions = ['A', 'B'];
        const rewardSummaries: ConditionRewardSummary[] = [
          { conditionCode: 'A', successCount: 90, totalCount: 100 },
          { conditionCode: 'B', successCount: 10, totalCount: 100 },
        ];
        const config: ThompsonSamplingConfig = { minimumDrawDifference: 0 };

        let aCount = 0;
        const runs = 200;
        for (let i = 0; i < runs; i++) {
          if (service.selectCondition(conditions, rewardSummaries, runs, config) === 'A') {
            aCount++;
          }
        }
        expect(aCount / runs).toBeGreaterThan(0.85);
      });
    });
  });

  describe('estimateConditionWeights', () => {
    it('returns empty object for empty conditions', () => {
      expect(service.estimateConditionWeights([])).toEqual({});
    });

    it('returns 100 for a single condition', () => {
      expect(service.estimateConditionWeights([{ code: 'A', alpha: 1, beta: 1 }])).toEqual({ A: 100 });
    });

    it('weights always sum to exactly 100', () => {
      const conditions = [
        { code: 'A', alpha: 5, beta: 3 },
        { code: 'B', alpha: 2, beta: 8 },
        { code: 'C', alpha: 10, beta: 1 },
      ];
      const weights = service.estimateConditionWeights(conditions);
      const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
      expect(total).toBe(100);
    });

    it('all weights are non-negative integers', () => {
      const conditions = [
        { code: 'A', alpha: 3, beta: 3 },
        { code: 'B', alpha: 3, beta: 3 },
        { code: 'C', alpha: 3, beta: 3 },
        { code: 'D', alpha: 3, beta: 3 },
      ];
      const weights = service.estimateConditionWeights(conditions);
      for (const w of Object.values(weights)) {
        expect(w).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(w)).toBe(true);
      }
    });

    it('two equal Beta(1,1) arms split near 50/50', () => {
      const conditions = [
        { code: 'A', alpha: 1, beta: 1 },
        { code: 'B', alpha: 1, beta: 1 },
      ];
      const weights = service.estimateConditionWeights(conditions);
      // With 10k draws and σ≈0.5%, ±10% is ~20σ — essentially never flaky
      expect(weights['A']).toBeGreaterThanOrEqual(40);
      expect(weights['A']).toBeLessThanOrEqual(60);
      expect(weights['B']).toBeGreaterThanOrEqual(40);
      expect(weights['B']).toBeLessThanOrEqual(60);
    });

    it('four equal arms each get roughly 25%', () => {
      const conditions = ['A', 'B', 'C', 'D'].map((code) => ({ code, alpha: 2, beta: 2 }));
      const weights = service.estimateConditionWeights(conditions);
      for (const w of Object.values(weights)) {
        expect(w).toBeGreaterThanOrEqual(15);
        expect(w).toBeLessThanOrEqual(35);
      }
    });

    it('dominant condition (90 successes / 10 failures) captures most weight', () => {
      const conditions = [
        { code: 'winner', alpha: 1 + 90, beta: 1 + 10 },
        { code: 'loser', alpha: 1 + 10, beta: 1 + 90 },
      ];
      const weights = service.estimateConditionWeights(conditions);
      expect(weights['winner']).toBeGreaterThanOrEqual(90);
      expect(weights['loser']).toBeLessThanOrEqual(10);
    });

    it('strong prior with no reward data drives weight toward the favored arm', () => {
      const conditions = [
        { code: 'favored', alpha: 100, beta: 1 },
        { code: 'weak', alpha: 1, beta: 100 },
      ];
      const weights = service.estimateConditionWeights(conditions);
      expect(weights['favored']).toBeGreaterThanOrEqual(90);
    });

    it('respects numDraws parameter — custom draw count still sums to 100', () => {
      const conditions = [
        { code: 'A', alpha: 3, beta: 2 },
        { code: 'B', alpha: 2, beta: 3 },
      ];
      const weights = service.estimateConditionWeights(conditions, 500);
      const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
      expect(total).toBe(100);
    });
  });

  describe('DEFAULT_PRIOR', () => {
    it('is Beta(1,1) — the uninformative prior', () => {
      expect(DEFAULT_PRIOR).toEqual({ success: 1, failure: 1 });
    });
  });
});
