import { ExperimentRewardsReplay } from 'upgrade_types';
import { ReplayConditionState, ReplayStep, betaDensityCurve, replayPosteriors } from './thompson-sampling-replay.util';
import { CONDITION_CHART_COLORS } from '../../shared/services/common-chart-helpers.service';

/**
 * Display logic for the experiment details page's Reward Replay card: the view model for its
 * Replay Stepper and the ngx-charts data for the stepper's posterior distribution chart. Kept out
 * of the components (which import ngx-charts, and so can't load under Jest) so it is tested.
 */

export interface ReplayConditionDisplay {
  conditionId: string;
  conditionCode: string;
  priorSuccess: number;
  priorFailure: number;
  color: string;
  /** Position of this condition in every ReplayStep.conditions array. */
  stateIndex: number;
}

export interface RewardReplayView {
  steps: ReplayStep[];
  /**
   * Sorted by conditionCode and colored in that order, the same way the enrollment chart does, so
   * a condition has the same color in every chart on the page.
   */
  conditions: ReplayConditionDisplay[];
  /** α: how much one reward adds to its condition's posterior. */
  scalingFactor: number;
}

export function buildRewardReplayView(replay: ExperimentRewardsReplay): RewardReplayView {
  const conditions = replay.conditions
    .map((condition, stateIndex) => ({
      conditionId: condition.conditionId,
      conditionCode: condition.conditionCode,
      priorSuccess: condition.priorSuccess,
      priorFailure: condition.priorFailure,
      stateIndex,
    }))
    .sort((a, b) => a.conditionCode.localeCompare(b.conditionCode))
    .map((condition, i) => ({ ...condition, color: CONDITION_CHART_COLORS[i % CONDITION_CHART_COLORS.length] }));

  return { steps: replayPosteriors(replay), conditions, scalingFactor: replay.scalingFactor };
}

export function clampStepIndex(index: number, stepCount: number): number {
  return Math.max(0, Math.min(stepCount - 1, index));
}

/**
 * A posterior parameter, or the scaled amount one reward adds to it, as fixed two decimals with a
 * leading zero ("0.20", "1.00", "31.25"). No thousands separator, since it appears inside "Beta(a, b)".
 */
export function formatPosteriorParameter(value: number): string {
  return value.toFixed(2);
}

export function formatPosterior(state: ReplayConditionState): string {
  return `Beta(${formatPosteriorParameter(state.alpha)}, ${formatPosteriorParameter(state.beta)})`;
}

export function formatPercentTick(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export interface ReplayChartPoint {
  name: number;
  value: number;
  min?: number;
  max?: number;
}

export interface ReplayChartSeries {
  name: string;
  series: ReplayChartPoint[];
}

/** ngx-charts line chart input: the series plus their colors, in the same order (ngx-charts colors by position). */
export interface ReplayChartData {
  results: ReplayChartSeries[];
  colors: string[];
}

// Every point gets a range from 0 up to the density, which ngx-charts shades with rangeFillOpacity,
// so each curve is drawn filled.
function densityPoints(state: ReplayConditionState): ReplayChartPoint[] {
  return betaDensityCurve(state.alpha, state.beta).map(({ x, density }) => ({
    name: x,
    value: density,
    min: 0,
    max: density,
  }));
}

/** Each condition's Beta density at the selected step, as a filled curve. */
export function posteriorDistributionChart(
  steps: ReplayStep[],
  conditions: ReplayConditionDisplay[],
  selectedIndex: number
): ReplayChartData {
  const step = steps[selectedIndex];
  if (!step) {
    return { results: [], colors: [] };
  }
  return {
    results: conditions.map((condition) => ({
      name: condition.conditionId,
      series: densityPoints(step.conditions[condition.stateIndex]),
    })),
    colors: conditions.map((condition) => condition.color),
  };
}
