import { ExperimentRewardsReplay } from 'upgrade_types';
import { betaDensityCurve, replayPosteriors } from './thompson-sampling-replay.util';

describe('betaDensityCurve', () => {
  const area = (points: { x: number; density: number }[]) =>
    points.slice(1).reduce((sum, p, i) => sum + ((p.density + points[i].density) / 2) * (p.x - points[i].x), 0);

  it('spans the whole 0–1 axis in increasing x order', () => {
    const curve = betaDensityCurve(1, 1);
    expect(curve[0].x).toBe(0);
    expect(curve[curve.length - 1].x).toBe(1);
    expect(curve.every((p, i) => i === 0 || p.x > curve[i - 1].x)).toBe(true);
  });

  it('is flat at 1 for Beta(1, 1), including the edges', () => {
    expect(betaDensityCurve(1, 1).every((p) => Math.abs(p.density - 1) < 1e-9)).toBe(true);
  });

  it('matches the closed form 2x for Beta(2, 1)', () => {
    for (const p of betaDensityCurve(2, 1)) {
      expect(p.density).toBeCloseTo(2 * p.x, 6);
    }
  });

  it('integrates to about 1 and keeps the peak of a sharp posterior', () => {
    // Beta(1600, 400): mean 0.8, sd ~0.0089, peak density ~44.6.
    const curve = betaDensityCurve(1600, 400);
    const peak = Math.max(...curve.map((p) => p.density));
    expect(area(curve)).toBeCloseTo(1, 2);
    expect(peak).toBeGreaterThan(44);
  });
});

const reward = (conditionId: string, success: boolean, minute: number) => ({
  conditionId,
  success,
  createdAt: new Date(Date.UTC(2026, 9, 27, 12, minute)).toISOString(),
});

const NO_EARLIER_REWARDS = { successes: 0, failures: 0, pendingSuccesses: 0, pendingFailures: 0 };

const condition = (
  conditionId: string,
  order: number,
  priorSuccess = 1,
  priorFailure = 1,
  earlierRewards = NO_EARLIER_REWARDS
) => ({ conditionId, conditionCode: conditionId.toUpperCase(), order, priorSuccess, priorFailure, earlierRewards });

const baseReplay = (overrides: Partial<ExperimentRewardsReplay> = {}): ExperimentRewardsReplay => ({
  conditions: [condition('a', 1), condition('b', 2)],
  rewards: [],
  earlierRewardCount: 0,
  batchSize: 1,
  warmupThreshold: 0,
  minimumDrawDifference: 0,
  scalingFactor: 1,
  ...overrides,
});

describe('replayPosteriors', () => {
  it('starts with a prior-only step', () => {
    const steps = replayPosteriors(baseReplay({ conditions: [condition('a', 1, 3, 2)] }));

    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ index: 0, reward: null, batch: null });
    expect(steps[0].conditions[0]).toMatchObject({ alpha: 3, beta: 2, mean: 0.6 });
  });

  it('applies each reward immediately when batchSize is 1', () => {
    const steps = replayPosteriors(
      baseReplay({ rewards: [reward('b', false, 3), reward('a', true, 5), reward('a', false, 9)] })
    );

    expect(steps.map((s) => s.conditions.map((c) => [c.alpha, c.beta]))).toEqual([
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 2],
      ],
      [
        [2, 1],
        [1, 2],
      ],
      [
        [2, 2],
        [1, 2],
      ],
    ]);
    expect(steps[1].batch).toEqual({ kind: 'applied' });
  });

  it('adds scalingFactor, not 1, per reward and leaves the priors unscaled', () => {
    const steps = replayPosteriors(
      baseReplay({
        conditions: [condition('a', 1, 3, 2)],
        scalingFactor: 0.25,
        rewards: [reward('a', true, 1), reward('a', true, 2), reward('a', false, 3)],
      })
    );

    expect(steps.map((s) => [s.conditions[0].alpha, s.conditions[0].beta])).toEqual([
      [3, 2],
      [3.25, 2],
      [3.5, 2],
      [3.5, 2.25],
    ]);
    expect(steps[3].conditions[0].mean).toBeCloseTo(3.5 / 5.75);
    // The raw counts behind the scaled posterior.
    expect(steps[3].conditions[0]).toMatchObject({ successes: 2, failures: 1 });
  });

  it('buffers rewards across the whole experiment and flushes every condition when the batch fills', () => {
    const steps = replayPosteriors(
      baseReplay({
        batchSize: 3,
        rewards: [reward('a', true, 1), reward('b', false, 2), reward('a', true, 3), reward('b', true, 4)],
      })
    );

    expect(steps[1].batch).toEqual({ kind: 'buffered', pending: 1, batchSize: 3 });
    expect(steps[2].batch).toEqual({ kind: 'buffered', pending: 2, batchSize: 3 });
    // Nothing moves while the batch is open, and buffered rewards aren't counted yet.
    expect(steps[2].conditions.map((c) => [c.alpha, c.beta])).toEqual([
      [1, 1],
      [1, 1],
    ]);
    expect(steps[2].conditions.map((c) => [c.successes, c.failures])).toEqual([
      [0, 0],
      [0, 0],
    ]);

    // The third reward closes the batch: both conditions' buffered rewards land together.
    expect(steps[3].batch).toEqual({ kind: 'flushed', pending: 3, batchSize: 3 });
    expect(steps[3].conditions.map((c) => [c.alpha, c.beta])).toEqual([
      [3, 1],
      [1, 2],
    ]);
    expect(steps[3].conditions.map((c) => [c.successes, c.failures])).toEqual([
      [2, 0],
      [0, 1],
    ]);

    expect(steps[4].batch).toEqual({ kind: 'buffered', pending: 1, batchSize: 3 });
  });

  it('ignores rewards for conditions it does not know about', () => {
    const steps = replayPosteriors(baseReplay({ rewards: [reward('a', true, 1), reward('gone', true, 2)] }));

    expect(steps).toHaveLength(2);
  });

  it("starts from the earlier rewards' posterior, finishing their open batch with the first replayed reward", () => {
    // Before the replayed rewards: A had 5 successes and 2 failures applied, and B had 1 success
    // buffered in an unfinished batch of 2.
    const steps = replayPosteriors(
      baseReplay({
        batchSize: 2,
        earlierRewardCount: 8,
        conditions: [
          condition('a', 1, 1, 1, { successes: 5, failures: 2, pendingSuccesses: 0, pendingFailures: 0 }),
          condition('b', 2, 1, 1, { successes: 0, failures: 0, pendingSuccesses: 1, pendingFailures: 0 }),
        ],
        rewards: [reward('a', false, 1)],
      })
    );

    expect(steps[0].conditions.map((c) => [c.alpha, c.beta])).toEqual([
      [6, 3],
      [1, 1],
    ]);
    expect(steps[1].batch).toEqual({ kind: 'flushed', pending: 2, batchSize: 2 });
    expect(steps[1].conditions.map((c) => [c.alpha, c.beta])).toEqual([
      [6, 4],
      [2, 1],
    ]);
  });
});
