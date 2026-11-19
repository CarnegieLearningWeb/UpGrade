import { CONDITION_CHART_COLORS } from '../../shared/services/common-chart-helpers.service';
import {
  buildRewardReplayView,
  clampStepIndex,
  formatPercentTick,
  formatPosterior,
  formatPosteriorParameter,
  posteriorDistributionChart,
} from './thompson-sampling-replay-chart.util';

// Two conditions listed B-first so the alphabetical sort is observable; A gets one success, then B one failure.
const earlierRewards = { successes: 0, failures: 0, pendingSuccesses: 0, pendingFailures: 0 };
const view = buildRewardReplayView({
  conditions: [
    { conditionId: 'id-b', conditionCode: 'B', order: 1, priorSuccess: 1, priorFailure: 1, earlierRewards },
    { conditionId: 'id-a', conditionCode: 'A', order: 2, priorSuccess: 1, priorFailure: 1, earlierRewards },
  ],
  rewards: [
    { conditionId: 'id-a', success: true, createdAt: '2026-10-27T12:03:00.000Z' },
    { conditionId: 'id-b', success: false, createdAt: '2026-10-27T12:05:00.000Z' },
  ],
  earlierRewardCount: 0,
  batchSize: 1,
  warmupThreshold: 0,
  minimumDrawDifference: 0,
  scalingFactor: 1,
});
const [conditionA, conditionB] = view.conditions;

describe('buildRewardReplayView', () => {
  it('sorts conditions by code and colors them in that order, like the enrollment chart', () => {
    const priors = { priorSuccess: 1, priorFailure: 1 };
    expect(view.conditions).toEqual([
      { conditionId: 'id-a', conditionCode: 'A', ...priors, stateIndex: 1, color: CONDITION_CHART_COLORS[0] },
      { conditionId: 'id-b', conditionCode: 'B', ...priors, stateIndex: 0, color: CONDITION_CHART_COLORS[1] },
    ]);
  });

  it('points stateIndex at the condition in every replayed step', () => {
    expect(view.steps).toHaveLength(3);
    expect(view.steps[1].conditions[conditionA.stateIndex]).toMatchObject({ alpha: 2, beta: 1 });
    expect(view.steps[2].conditions[conditionB.stateIndex]).toMatchObject({ alpha: 1, beta: 2 });
  });
});

describe('clampStepIndex', () => {
  it('keeps an index within the steps', () => {
    expect(clampStepIndex(-3, 5)).toBe(0);
    expect(clampStepIndex(2, 5)).toBe(2);
    expect(clampStepIndex(9, 5)).toBe(4);
  });
});

describe('formatPercentTick', () => {
  it('formats a 0–1 value as a whole percentage', () => {
    expect(formatPercentTick(0.25)).toBe('25%');
    expect(formatPercentTick(1)).toBe('100%');
  });
});

describe('formatPosteriorParameter', () => {
  it('always shows two decimals, with a leading zero below 1 and no thousands separator', () => {
    expect(formatPosteriorParameter(0.2)).toBe('0.20');
    expect(formatPosteriorParameter(1)).toBe('1.00');
    expect(formatPosteriorParameter(31.25)).toBe('31.25');
    expect(formatPosteriorParameter(1234.5)).toBe('1234.50');
  });

  it('hides floating-point noise from scaled counts', () => {
    expect(formatPosteriorParameter(1 + 0.1 * 3)).toBe('1.30');
  });
});

describe('formatPosterior', () => {
  it('formats both Beta parameters to two decimals', () => {
    expect(formatPosterior({ conditionId: 'a', alpha: 7.5, beta: 3, successes: 26, failures: 8, mean: 0.714 })).toBe(
      'Beta(7.50, 3.00)'
    );
  });
});

describe('posterior distributions at the selected step', () => {
  it('draws one filled curve per condition at the prior', () => {
    const { results, colors } = posteriorDistributionChart(view.steps, view.conditions, 0);

    expect(results.map((series) => series.name)).toEqual(['id-a', 'id-b']);
    expect(colors).toEqual([conditionA.color, conditionB.color]);
    const point = results[0].series[10];
    expect(point.value).toBeCloseTo(1, 9);
    expect(point.min).toBe(0);
    expect(point.max).toBe(point.value);
  });

  it('draws only the current curves after a reward, with the moved condition updated', () => {
    const { results, colors } = posteriorDistributionChart(view.steps, view.conditions, 1);

    expect(results.map((series) => series.name)).toEqual(['id-a', 'id-b']);
    expect(colors).toEqual([conditionA.color, conditionB.color]);
    // After one success, A is Beta(2, 1), whose density at x is 2x.
    const last = results[0].series[results[0].series.length - 1];
    expect(last.name).toBe(1);
    expect(last.value).toBeCloseTo(2, 6);
    // B hasn't been rewarded yet, so it is still the flat Beta(1, 1) prior.
    expect(results[1].series.every((point) => Math.abs(point.value - 1) < 1e-9)).toBe(true);
  });

  it('returns no curves for a step that does not exist', () => {
    expect(posteriorDistributionChart(view.steps, view.conditions, 99)).toEqual({ results: [], colors: [] });
  });
});
