import { ExperimentRewardsReplay, ExperimentRewardsReplayReward } from 'upgrade_types';

/**
 * Client-side replay of a Thompson Sampling experiment's posteriors, reward by reward.
 *
 * Mirrors the backend's update rules so the replay matches what was applied:
 * - each condition's posterior is Beta(priorSuccess + scalingFactor × successes,
 *   priorFailure + scalingFactor × failures) (ThompsonSamplingService.computePosterior)
 * - with batchSize above 1, rewards are buffered across the whole experiment and folded into every
 *   condition's counts once the buffered total reaches batchSize (ThompsonSamplingRewardService)
 *
 * It uses the experiment's current priors, batchSize and scalingFactor, so it won't match history if
 * any was edited mid-experiment.
 */

export interface ReplayConditionState {
  conditionId: string;
  /** The Beta posterior's first parameter (prior + scaled successes). Not the scaling factor α. */
  alpha: number;
  /** The Beta posterior's second parameter (prior + scaled failures). */
  beta: number;
  /**
   * Raw (unscaled) reward counts folded into this posterior so far. Rewards still buffered in an
   * open batch aren't included, since they haven't moved the posterior yet.
   */
  successes: number;
  failures: number;
  /** Posterior mean success rate, alpha / (alpha + beta). */
  mean: number;
}

export type ReplayBatchStatus =
  | { kind: 'applied' }
  | { kind: 'buffered'; pending: number; batchSize: number }
  | { kind: 'flushed'; pending: number; batchSize: number };

export interface ReplayStep {
  /** 0 is the prior, before any reward; n is the state after the nth reward. */
  index: number;
  reward: ExperimentRewardsReplayReward | null;
  batch: ReplayBatchStatus | null;
  /** One entry per condition, in the same order as the replay's conditions. */
  conditions: ReplayConditionState[];
}

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

function logGamma(x: number): number {
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  const z = x - 1;
  let sum = LANCZOS[0];
  for (let i = 1; i < LANCZOS.length; i++) {
    sum += LANCZOS[i] / (z + i);
  }
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}

function betaMoments(alpha: number, beta: number): { mean: number; sd: number } {
  const n = alpha + beta;
  return { mean: alpha / n, sd: Math.sqrt((alpha * beta) / (n * n * (n + 1))) };
}

function betaLogNormalizer(alpha: number, beta: number): number {
  return logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta);
}

// Keeps x off the exact edges: there log(0) is -Infinity, and with alpha (or beta) of exactly 1 the
// exponent becomes 0 * -Infinity = NaN. Priors are at least 1, so the density is finite at the edges.
const EDGE = 1e-9;

function betaDensity(x: number, alpha: number, beta: number, logNormalizer: number): number {
  const inside = Math.min(Math.max(x, EDGE), 1 - EDGE);
  return Math.exp((alpha - 1) * Math.log(inside) + (beta - 1) * Math.log(1 - inside) - logNormalizer);
}

export interface DensityPoint {
  /** Success rate, 0 to 1. */
  x: number;
  density: number;
}

const CURVE_BASE_POINTS = 101;
const CURVE_PEAK_POINTS = 120;
const CURVE_PEAK_SDS = 6;

/**
 * Beta(alpha, beta) density sampled across [0, 1] for drawing. An evenly spaced grid covers the
 * whole axis, and extra points around the mean keep a sharp posterior's peak (one with many
 * rewards behind it) from falling between grid points and being drawn too low.
 */
export function betaDensityCurve(alpha: number, beta: number): DensityPoint[] {
  const { mean, sd } = betaMoments(alpha, beta);
  const logNorm = betaLogNormalizer(alpha, beta);
  const xs = new Set<number>();
  for (let i = 0; i < CURVE_BASE_POINTS; i++) {
    xs.add(i / (CURVE_BASE_POINTS - 1));
  }
  const lo = Math.max(0, mean - CURVE_PEAK_SDS * sd);
  const hi = Math.min(1, mean + CURVE_PEAK_SDS * sd);
  for (let i = 0; i < CURVE_PEAK_POINTS; i++) {
    xs.add(lo + ((hi - lo) * i) / (CURVE_PEAK_POINTS - 1));
  }
  return [...xs].sort((a, b) => a - b).map((x) => ({ x, density: betaDensity(x, alpha, beta, logNorm) }));
}

export function replayPosteriors(replay: ExperimentRewardsReplay): ReplayStep[] {
  const conditionIndex = new Map(replay.conditions.map((condition, i) => [condition.conditionId, i]));
  const counts = replay.conditions.map(() => ({ successes: 0, failures: 0 }));
  const pending = replay.conditions.map(() => ({ successes: 0, failures: 0 }));
  const batchSize = replay.batchSize > 1 ? replay.batchSize : 1;
  const { scalingFactor } = replay;

  const snapshot = (
    index: number,
    reward: ExperimentRewardsReplayReward | null,
    batch: ReplayBatchStatus | null
  ): ReplayStep => ({
    index,
    reward,
    batch,
    conditions: replay.conditions.map((condition, i) => {
      const alpha = condition.priorSuccess + scalingFactor * counts[i].successes;
      const beta = condition.priorFailure + scalingFactor * counts[i].failures;
      return {
        conditionId: condition.conditionId,
        alpha,
        beta,
        successes: counts[i].successes,
        failures: counts[i].failures,
        mean: alpha / (alpha + beta),
      };
    }),
  });

  const steps: ReplayStep[] = [snapshot(0, null, null)];

  for (const reward of replay.rewards) {
    const i = conditionIndex.get(reward.conditionId);
    if (i === undefined) {
      continue;
    }
    if (reward.success) {
      pending[i].successes++;
    } else {
      pending[i].failures++;
    }

    const pendingTotal = pending.reduce((sum, p) => sum + p.successes + p.failures, 0);
    let batch: ReplayBatchStatus;

    if (batchSize <= 1 || pendingTotal >= batchSize) {
      pending.forEach((p, j) => {
        counts[j].successes += p.successes;
        counts[j].failures += p.failures;
        p.successes = 0;
        p.failures = 0;
      });
      batch = batchSize <= 1 ? { kind: 'applied' } : { kind: 'flushed', pending: pendingTotal, batchSize };
    } else {
      batch = { kind: 'buffered', pending: pendingTotal, batchSize };
    }

    steps.push(snapshot(steps.length, reward, batch));
  }

  return steps;
}
