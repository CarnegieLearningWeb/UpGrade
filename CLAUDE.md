# UpGrade Monorepo

## Structure

Yarn workspaces monorepo. The workspace packages are `packages/*` only — `clientlibs/*` is NOT part of the Yarn workspace.

```
packages/
  backend/     NestJS-style Express API (routing-controllers + TypeDI)
  frontend/    Angular 20+ app with ngrx
  types/       Shared TypeScript types — imported as `upgrade_types` alias

clientlibs/
  js/          Multi-target TypeScript SDK (browser/node/lite)
  java/        Java client library
  csharp/      C# client library
```

**CRITICAL — Legacy directories:** The root-level `/backend`, `/frontend`, and `/types` directories are deprecated. Always work in `/packages/backend`, `/packages/frontend`, `/packages/types`.

## Running Package Scripts

Use workspace commands from the repo root:

```bash
yarn workspace upgrade-backend <script>
yarn workspace upgrade-frontend <script>
```

Or `cd` into the package and run scripts directly.

## Shared Type Alias

All packages import shared types using the `upgrade_types` alias — never with relative paths:

```ts
import { EXPERIMENT_STATE, IFeatureFlag } from 'upgrade_types';
```

This alias is configured in each package's `tsconfig.json` paths. If you add new types to `packages/types`, rebuild it (`npm run build` in that package) for consumers to pick up changes locally.

## Pre-commit Hooks

Husky runs automatically on `git commit`:
- `lint-staged` — Prettier + ESLint on staged files
- `yarn workspace upgrade-frontend typecheck`
- `yarn workspace upgrade-backend typecheck`

Both typechecks must pass. Do not bypass with `--no-verify`.

## Code Style

- **Prettier:** singleQuote, 120 printWidth, trailingComma es5
- **ESLint:** TypeScript + Angular rules, extends prettier config
- Auto-fix: `yarn prettier:write` (root) or `npm run prettier:write` in a package

## Local Development

```bash
docker-compose up   # frontend :4200, backend :3030, postgres :5432
```

Environment files: copy `packages/backend/.env.example` to `packages/backend/.env` for local dev.

## Package Versions

All packages are versioned together (currently v6.5.0). Keep versions in sync when bumping.

---

## Native Thompson Sampling Migration

**Goal:** Remove the third-party MoocLet integration and replace it with a native TypeScript Thompson Sampling implementation. Retain UI visually as-is. No use of the term "mooclet" anywhere in the new codebase.

**Reference:** MoocLet engine source at `~/Code/mooclet-engine` (read-only reference — do NOT copy logic from it).

### Algorithm parameters carried over (renamed)

| Old (MoocLet) | New | Purpose |
|---|---|---|
| `prior` | `prior` | Beta(α, β) priors per condition |
| `uniform_threshold` | `warmupThreshold` | Uniform random during cold-start |
| `batch_size` | `batchSize` | Batch posterior updates |
| `tspostdiff_thresh` | `minimumDrawDifference` | Fall back to uniform when arms converge |

Binary rewards only (SUCCESS=1, FAILURE=0). No `max_rating`/`min_rating`.

### Progress

**Phase 1 — Core algorithm (backend, pure functions)**
- [x] `ThompsonSamplingService` with `selectCondition()` — no DB or HTTP dependencies
- [x] Unit tests (14 passing) — warmup, priors, multi-arm, thresholds

**Phase 2 — Data model**
- [x] New entity: `ThompsonSamplingExperimentConfig` (replaces `MoocletExperimentRef`)
- [x] New entity: `ConditionPosteriorState` per condition (stores current α/β)
- [x] New entity: `ThompsonSamplingReward` (raw reward events — audit trail + recalculation)
- [x] Repositories: `ThompsonSamplingExperimentConfigRepository`, `ConditionPosteriorStateRepository`
- [x] Add `ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING = 'thompson_sampling'` to `upgrade_types`
- [x] DB migration: `1781222400000-thompsonSamplingEntities`

**Phase 3 — Assignment integration**
- [x] Wire `ThompsonSamplingService` into `ExperimentAssignmentService` — `assignThompsonSampling()` method handles THOMPSON_SAMPLING algorithm
- [x] `ThompsonSamplingRewardService` replaces `MoocletRewardsService` — stores `ThompsonSamplingReward` + increments `ConditionPosteriorState` counts
- [x] `POST /v6/reward` rewired to `ThompsonSamplingRewardService.recordReward()`; mooclet guard removed

**Phase 4 — Experiment CRUD**
- [x] `ThompsonSamplingExperimentCrudService` — `createConfig`, `updateConfig`, `syncConditions`
- [x] `ExperimentController` create/update/delete handlers use native TS flow; mooclet routing removed
- [x] `ExperimentAssignmentService` mooclet branch removed; `handleEnrollCondition` mooclet path removed
- [x] `ImportExportService` mooclet routing removed from bulk create and export
- [x] Deleted: `MoocletExperimentService`, `MoocletDataService`, `MoocletRewardsService` + their tests/mocks

**Phase 5 — Frontend**
- [x] `ThompsonSamplingHelperService` replaces `MoocletExperimentHelperService` across all components
- [x] NgRx state: `moocletPolicyParameters` → `thompsonSamplingConfig`; `ThompsonSamplingConfigDTO` added to model
- [x] Form fields renamed: `batch_size`→`batchSize`, `uniform_threshold`→`warmupThreshold`, `tspostdiff_thresh`→`minimumDrawDifference`
- [x] Algorithm check: `MOOCLET_TS_CONFIGURABLE` → `THOMPSON_SAMPLING` throughout
- [x] Dead rewards effect + data service method removed; `mooclet-rewards` API endpoint removed
- [x] `moocletToggle` feature flag removed from all env files
- [x] Deleted: `mooclet-helper.service.ts`, `mooclet-helper.service.spec.ts`; rewards effect tests removed

**Phase 6 — Cleanup**
- [x] DB migration `1781308800000-cleanupMoocletEntities`: data-migrates `ts_configurable` → `thompson_sampling`, drops mooclet tables, removes `ts_configurable` from enum
- [x] Removed `MOOCLETS_*` env vars from `env.ts` and `.env.example`
- [x] `upgrade_types`: removed `Mooclet/` directory, `MOOCLET_TS_CONFIGURABLE` enum value, `SUPPORTED_MOOCLET_ALGORITHMS`; `Prior`, `BinaryRewardAllowedValue`, `ExperimentRewardsSummary` moved to `Experiment/interfaces.ts`
- [x] Deleted: mooclet models, repository, error class, types file
- [x] Removed mooclet validation from `ExperimentDTO`, mooclet inject from `ExperimentService`, mooclet error cases from `ErrorHandlerMiddleware`

### Post-migration fixes

- **Reward error type**: `ThompsonSamplingRewardService.throwConflictError` sets `(error as any).type = SERVER_ERROR.ASSIGNMENT_ERROR` explicitly. Without this, a plain `HttpError(409)` falls through to the middleware's httpCode switch where 409 → `SERVER_ERROR.DUPLICATE_KEY` (whose string is the unrelated feature flag message). Added `case SERVER_ERROR.ASSIGNMENT_ERROR` to `ErrorHandlerMiddleware` outer switch.

- **thompsonSamplingConfig missing in API responses**: `getSingleExperiment`, `create`, and `update` all return `ExperimentDTO` without loading `thompsonSamplingConfig` (it's in a separate table). Added `attachThompsonSamplingConfig()` private method to `ExperimentController` that queries the config for THOMPSON_SAMPLING experiments and attaches it; called on all three response paths. Also added `getConfigForExperiment()` to `ThompsonSamplingExperimentCrudService`.

- **Form/overview labels still showing old terms**: Updated `packages/frontend/projects/upgrade/src/assets/i18n/en.json` — `"uniform-threshold.label.text"` → "Warmup Threshold", `"tspostdiff-thresh.label.text"` → "Minimum Draw Difference" (with updated hints). The translation keys themselves are unchanged; only the values were updated.

### Architecture notes

- **conditionId as algorithm key**: `ThompsonSamplingService.selectCondition()` uses condition UUIDs (not `conditionCode`) as identifiers, since `conditionCode` is nullable. `ConditionPosteriorState` rows are keyed by `conditionId`. The `priors` field in `ThompsonSamplingConfigDTO` is therefore also keyed by conditionId.

- **Reward summary endpoint**: `GET /experiments/rewards/:id` delegates to `ThompsonSamplingExperimentCrudService.getRewardsSummary()`, which queries `ConditionPosteriorState` rows joined to conditions, computes `successes`, `failures`, `successRate`, `priorSuccess`, `priorFailure` per condition, and sorts by condition order. Fully implemented.
