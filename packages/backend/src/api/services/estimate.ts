// Pure TS Beta distribution sampler (no dependencies)

function randNormal(): number {
  return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

function randGamma(shape: number): number {
  if (shape < 1) {
    return randGamma(1 + shape) * Math.pow(Math.random(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let v: number;
    let x: number;
    do {
      x = randNormal();
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function randBeta(alpha: number, beta: number): number {
  const g1 = randGamma(alpha);
  const g2 = randGamma(beta);
  return g1 / (g1 + g2);
}

// ---

interface ArmPosterior {
  versionId: string;
  successes: number;
  failures: number;
}

interface ArmPrior {
  priorSuccess: number;
  priorFailure: number;
}

interface VersionWeight {
  versionId: string;
  estimatedCurrentWeight: string;
}

export function estimateThompsonWeights(arms: ArmPosterior[], prior: ArmPrior, iterations = 10_000): VersionWeight[] {
  const wins = new Array(arms.length).fill(0);

  for (let i = 0; i < iterations; i++) {
    let maxSample = -1;
    let maxIdx = 0;
    for (let j = 0; j < arms.length; j++) {
      const alpha = arms[j].successes + prior.priorSuccess;
      const beta = arms[j].failures + prior.priorFailure;
      const sample = randBeta(alpha, beta);
      if (sample > maxSample) {
        maxSample = sample;
        maxIdx = j;
      }
    }
    wins[maxIdx]++;
  }

  const raw = arms.map((arm, i) => (wins[i] / iterations) * 100);

  // Normalize so rounded values sum exactly to 100
  const floored = raw.map(Math.floor);
  const remainder = 100 - floored.reduce((a, b) => a + b, 0);
  const diffs = raw.map((v, i) => v - floored[i]);
  const indices = diffs
    .map((d, i) => ({ d, i }))
    .sort((a, b) => b.d - a.d)
    .map(({ i }) => i);
  for (let k = 0; k < remainder; k++) floored[indices[k]]++;

  return arms.map((arm, i) => ({
    versionId: arm.versionId,
    estimatedCurrentWeight: floored[i].toFixed(1),
  }));
}
