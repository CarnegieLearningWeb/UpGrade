import { Service } from 'typedi';

export interface ConditionPrior {
  success: number;
  failure: number;
}

export interface ConditionRewardSummary {
  conditionId: string;
  successCount: number;
  failureCount: number;
  totalCount: number;
}

export interface ThompsonSamplingConfig {
  /** Per-condition Beta distribution priors. Conditions without an entry use DEFAULT_PRIOR. */
  priors?: Record<string, ConditionPrior>;
  /** Use uniform random selection until total reward observations exceed this count. */
  warmupThreshold?: number;
  /** Fall back to uniform when the top two sampled draws differ by less than this value. */
  minimumDrawDifference?: number;
}

export const DEFAULT_PRIOR: ConditionPrior = { success: 1, failure: 1 };

@Service()
export class ThompsonSamplingService {
  /**
   * Estimate how often each condition would "win" a Thompson Sampling draw given current posteriors.
   *
   * Runs `numDraws` simulated rounds. Each round samples Beta(alpha, beta) for every condition and
   * awards the round to the highest draw. Win counts are converted to integer percentages via the
   * Largest Remainder Method so the result always sums to exactly 100.
   *
   * When every condition shares the same alpha/beta (e.g. equal priors and no reward data yet),
   * the true win rate is exactly uniform by symmetry — skip the simulation and its sampling noise.
   *
   * @param conditions - Each condition with its current posterior alpha and beta parameters
   * @param numDraws   - Number of simulated draws (default 10 000)
   * @returns Map of conditionCode → integer percentage in [0, 100]; sums to 100
   */
  estimateConditionWeights(
    conditions: Array<{ code: string; alpha: number; beta: number }>,
    numDraws = 10_000
  ): Record<string, number> {
    if (conditions.length === 0) return {};
    if (conditions.length === 1) return { [conditions[0].code]: 100 };

    if (conditions.every((c) => c.alpha === conditions[0].alpha && c.beta === conditions[0].beta)) {
      return this.distributeEvenly(conditions.map((c) => c.code));
    }

    const wins = new Map<string, number>(conditions.map((c) => [c.code, 0]));

    for (let i = 0; i < numDraws; i++) {
      let bestDraw = -1;
      let winner = conditions[0].code;
      for (const { code, alpha, beta } of conditions) {
        const draw = this.sampleBeta(alpha, beta);
        if (draw > bestDraw) {
          bestDraw = draw;
          winner = code;
        }
      }
      wins.set(winner, (wins.get(winner) ?? 0) + 1);
    }

    return this.toIntegerPercentages(
      conditions.map((c) => ({ code: c.code, raw: ((wins.get(c.code) ?? 0) / numDraws) * 100 }))
    );
  }

  // Splits 100 points evenly across codes (Largest Remainder Method handles the non-divisible case).
  private distributeEvenly(codes: string[]): Record<string, number> {
    return this.toIntegerPercentages(codes.map((code) => ({ code, raw: 100 / codes.length })));
  }

  // Largest Remainder Method: floor each raw percentage then distribute the
  // remaining integer points to the entries with the largest fractional parts.
  private toIntegerPercentages(raws: Array<{ code: string; raw: number }>): Record<string, number> {
    const withFloors = raws.map(({ code, raw }) => ({
      code,
      floor: Math.floor(raw),
      remainder: raw - Math.floor(raw),
    }));
    const pointsLeft = 100 - withFloors.reduce((sum, r) => sum + r.floor, 0);
    withFloors.sort((a, b) => b.remainder - a.remainder);

    const result: Record<string, number> = {};
    withFloors.forEach((r, i) => {
      result[r.code] = r.floor + (i < pointsLeft ? 1 : 0);
    });
    return result;
  }

  /**
   * Select a condition using Thompson Sampling.
   *
   * @param conditionIds - All eligible condition IDs for this experiment
   * @param rewardSummaries - Accumulated reward counts per condition
   * @param totalRewardCount - Total number of reward observations collected across all conditions,
   *   including any not yet folded into the posteriors by a pending batch flush
   * @param config - Optional algorithm parameters (priors, warmup, thresholds)
   */
  selectCondition(
    conditionIds: string[],
    rewardSummaries: ConditionRewardSummary[],
    totalRewardCount: number,
    config: ThompsonSamplingConfig = {}
  ): string {
    if (conditionIds.length === 0) {
      throw new Error('Cannot select from an empty condition list');
    }
    if (conditionIds.length === 1) {
      return conditionIds[0];
    }

    // Warmup phase: use uniform random until sufficient reward evidence has been collected.
    // Gated on reward observations (not assignments) — the posteriors only move when rewards
    // arrive, so that's the right measure of "how much evidence do we actually have."
    if (config.warmupThreshold !== undefined && totalRewardCount <= config.warmupThreshold) {
      return this.uniformRandom(conditionIds);
    }

    const summaryMap = new Map(rewardSummaries.map((s) => [s.conditionId, s]));

    const draws = conditionIds.map((conditionId) => {
      const summary = summaryMap.get(conditionId);
      const prior = config.priors?.[conditionId] ?? DEFAULT_PRIOR;
      const { alpha, beta } = this.computePosterior(
        prior.success,
        prior.failure,
        summary?.successCount ?? 0,
        summary?.failureCount ?? 0
      );
      return { conditionId, draw: this.sampleBeta(alpha, beta) };
    });

    draws.sort((a, b) => b.draw - a.draw);

    // Fall back to uniform when the top two draws are too close to distinguish
    if (
      config.minimumDrawDifference &&
      draws.length >= 2 &&
      draws[0].draw - draws[1].draw < config.minimumDrawDifference
    ) {
      return this.uniformRandom(conditionIds);
    }

    return draws[0].conditionId;
  }

  /**
   * Beta posterior parameters for a condition, given its Beta(priorSuccess, priorFailure) prior and
   * its accumulated success/failure counts. Shared by selectCondition() (which condition to draw)
   * and ThompsonSamplingExperimentCrudService.getRewardsSummary() (the same math, for display) so
   * a future correction to this formula can't be applied to one and missed in the other.
   */
  computePosterior(
    priorSuccess: number,
    priorFailure: number,
    successCount: number,
    failureCount: number
  ): { alpha: number; beta: number } {
    return { alpha: priorSuccess + successCount, beta: priorFailure + failureCount };
  }

  /**
   * Builds a `{ [conditionId]: { success, failure } }` prior record from posterior state rows.
   * Shared by ExperimentAssignmentService (feeding the algorithm's config) and
   * ThompsonSamplingExperimentCrudService (attaching config to API responses/export).
   */
  buildPriorsRecord(
    states: Array<{ conditionId: string; priorSuccess: number; priorFailure: number }>
  ): Record<string, ConditionPrior> {
    const priors: Record<string, ConditionPrior> = {};
    states.forEach((state) => {
      priors[state.conditionId] = { success: state.priorSuccess, failure: state.priorFailure };
    });
    return priors;
  }

  private uniformRandom(conditionIds: string[]): string {
    return conditionIds[Math.floor(Math.random() * conditionIds.length)];
  }

  // Beta(α, β) sampled as the ratio of two independent Gamma samples
  private sampleBeta(alpha: number, beta: number): number {
    const x = this.sampleGamma(alpha);
    const y = this.sampleGamma(beta);
    return x / (x + y);
  }

  // Gamma(α, 1) via Marsaglia–Tsang's squeeze method.
  // Source: Marsaglia, G. & Tsang, W.W. (2000). "A Simple Method for Generating Gamma Variables."
  //   ACM Transactions on Mathematical Software, 26(3), pp. 363–372. DOI: 10.1145/358407.358414
  // The same algorithm is used by d3-random (https://github.com/d3/d3-random/blob/main/src/gamma.js)
  // and jStat (https://github.com/jstat/jstat). This implementation follows the paper directly.
  private sampleGamma(alpha: number): number {
    if (alpha < 1) {
      // Reduction: Gamma(α) = Gamma(α+1) · U^(1/α) where U ~ Uniform(0,1)
      return this.sampleGamma(alpha + 1) * Math.pow(Math.random(), 1 / alpha);
    }
    const d = alpha - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x: number;
      let v: number;
      do {
        x = this.sampleNormal();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = Math.random();
      // Fast accept path (avoids log when safe)
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v;
      }
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v;
      }
    }
  }

  // N(0,1) via the Marsaglia polar method (polar form of Box–Muller).
  // Source: Knuth, D.E. (1997). The Art of Computer Programming, Vol. 2, §3.4.1, Algorithm P.
  // Original derivation: Marsaglia, G. & Bray, T.A. (1964). "A Convenient Method for Generating
  //   Normal Variables." SIAM Review, 6(3), pp. 260–264. DOI: 10.1137/1006063
  // Preferred over the basic Box–Muller form because it avoids evaluating trig functions and
  // handles the degenerate case where Math.random() returns exactly 0 (log(0) = -Infinity).
  private sampleNormal(): number {
    let u: number, v: number, s: number;
    do {
      u = Math.random() * 2 - 1;
      v = Math.random() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    return u * Math.sqrt((-2 * Math.log(s)) / s);
  }
}
