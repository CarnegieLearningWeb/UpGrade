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
- [x] DB migration: consolidated into `1788362726319-nativeThompsonSampling` (see Phase 6 note)

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
- [x] DB migration `1788362726319-nativeThompsonSampling`: data-migrates `ts_configurable` → `thompson_sampling`, drops mooclet tables, removes `ts_configurable` from enum, creates the three Thompson Sampling tables (including `pendingSuccessCount`/`pendingFailureCount`/`pendingTotalCount` for batched posterior updates) and bootstraps config/posterior rows. This single migration replaces what were originally four separate ones (`thompsonSamplingEntities`, `cleanupMoocletEntities`, `bootstrapThompsonSamplingConfigs`, and a later `addPendingRewardCountsToConditionPosteriorState`) — none had shipped to dev or been applied to any real database, so they were squashed rather than kept as sequential steps. Its timestamp is deliberately ordered after `1783627365221-experimentPrecomputedSegment`, the newest migration actually merged to dev as of this branch's last rebase — check `git log origin/dev -- packages/backend/src/database/migrations` before merging in case dev has moved further; this migration's timestamp must stay the newest of the two.
- [x] Removed `MOOCLETS_*` env vars from `env.ts` and `.env.example`
- [x] `upgrade_types`: removed `Mooclet/` directory, `MOOCLET_TS_CONFIGURABLE` enum value, `SUPPORTED_MOOCLET_ALGORITHMS`; `Prior`, `BinaryRewardAllowedValue`, `ExperimentRewardsSummary` moved to `Experiment/interfaces.ts`
- [x] Deleted: mooclet models, repository, error class, types file
- [x] Removed mooclet validation from `ExperimentDTO`, mooclet inject from `ExperimentService`, mooclet error cases from `ErrorHandlerMiddleware`

### Post-migration fixes

- **Reward error type**: `ThompsonSamplingRewardService.throwConflictError` sets `(error as any).type = SERVER_ERROR.ASSIGNMENT_ERROR` explicitly. Without this, a plain `HttpError(409)` falls through to the middleware's httpCode switch where 409 → `SERVER_ERROR.DUPLICATE_KEY` (whose string is the unrelated feature flag message). Added `case SERVER_ERROR.ASSIGNMENT_ERROR` to `ErrorHandlerMiddleware` outer switch.

- **thompsonSamplingConfig missing in API responses**: `getSingleExperiment`, `create`, and `update` all return `ExperimentDTO` without loading `thompsonSamplingConfig` (it's in a separate table). Added `attachThompsonSamplingConfig()` private method to `ExperimentController` that queries the config for THOMPSON_SAMPLING experiments and attaches it; called on all three response paths. Also added `getConfigForExperiment()` to `ThompsonSamplingExperimentCrudService`. (This private method was later moved onto `ThompsonSamplingExperimentCrudService` itself as the public `attachConfigToExperiment()` — see "Bulk import/batch-create never created a Thompson Sampling config" below — so it could be reused outside the controller.)

- **Form/overview labels still showing old terms**: Updated `packages/frontend/projects/upgrade/src/assets/i18n/en.json` — `"uniform-threshold.label.text"` → "Warmup Threshold", `"tspostdiff-thresh.label.text"` → "Minimum Draw Difference" (with updated hints). The translation keys themselves are unchanged; only the values were updated.

- **`thompsonSamplingConfig` request validation was missing**: `ExperimentDTO.thompsonSamplingConfig` was an unvalidated inline object type, so negative/NaN priors or thresholds could reach `ThompsonSamplingService`'s Beta/Gamma sampling math. Replaced with a `ThompsonSamplingConfigValidator` class (`@ValidateNested()` + `@Type()`), bounds mirrored from `ThompsonSamplingHelperService.getFieldValidators()`/`getPriorFieldValidators()` on the frontend: `warmupThreshold`/`batchSize` are integers in `1`–`1,000,000` (`warmupThreshold` allows `0`), `minimumDrawDifference` is `0`–`1`, and `priors` (a `Record<conditionId, {success, failure}>`) is validated via a custom `IsThompsonSamplingPriorsRecord` decorator requiring integer `success`/`failure` in `1`–`1,000,000` — strictly positive, since they feed `alpha`/`beta` into `sampleGamma()`.

- **`warmupThreshold` was gated on the wrong count**: `assignThompsonSampling()` computed `totalEnrollments` as `sum(ConditionPosteriorState.totalCount)`, but `totalCount` only increments on reward (`ThompsonSamplingRewardService`), never on assignment — so the variable name lied about what it measured. Renamed to `totalRewardCount` throughout (`ThompsonSamplingService.ts`, `ExperimentAssignmentService.ts`, `ThompsonSamplingExperimentConfig.ts`). This is also the semantically correct thing to gate on: the posteriors (`alpha`/`beta`) only move when rewards arrive, so warmup should measure how much reward evidence has accumulated, not how many users were assigned — gating on assignment count would exit warmup while posteriors are still sitting at the prior, or (in the low-latency-reward case) too early relative to actual evidence. The MoocLet reference engine gated on assignment count (`variable__name="version"` in `policies.py`), but that behavior was never a requirement here — CLAUDE.md already says not to copy logic from that reference — and gating on rewards is the better design regardless.

- **`batchSize` wired in**: was stored on `ThompsonSamplingExperimentConfig` and exposed in the UI form but never consumed anywhere. `ConditionPosteriorState` gained `pendingSuccessCount`/`pendingFailureCount`/`pendingTotalCount` columns; `ThompsonSamplingRewardService.applyOrBufferReward()` now buffers rewards there and only folds them into `successCount`/`failureCount`/`totalCount` (the values that drive the posteriors used for sampling) once `batchSize` observations have accumulated. `batchSize` unset or `≤1` applies immediately (matches pre-batching behavior). The raw `ThompsonSamplingReward` audit row is always written regardless of batching — nothing is lost, batching only delays when a reward affects assignment.

- **`failureCount`/`pendingFailureCount` are stored, not derived**: `ConditionPosteriorState` now stores both counts explicitly rather than computing failures as `totalCount - successCount` (and `pendingFailureCount` as `pendingTotalCount - pendingSuccessCount`) at every call site. All three prior read sites were updated to read the column directly: `ThompsonSamplingExperimentCrudService.getRewardsSummary()` (`failures`/`beta`), `ThompsonSamplingService.selectCondition()` (`beta`, via a new `failureCount` field on `ConditionRewardSummary`), and `ExperimentAssignmentService.assignThompsonSampling()` (populates `ConditionRewardSummary.failureCount` from `state.failureCount` when building reward summaries for assignment).

- **`batchSize` was gated per-condition instead of per-experiment**: `applyOrBufferReward()` originally checked `pendingTotalCount` on only the one `ConditionPosteriorState` row the incoming reward belonged to, so `batchSize` behaved as a per-condition threshold — e.g. with `batchSize=5`, 4 rewards on condition A and 1 on condition B would never flush, since neither condition individually reached 5. `batchSize` is meant to pace how often posteriors move for the experiment as a whole, and a reward for any condition is evidence toward that same shared cadence. Fixed by summing `pendingTotalCount` across every `ConditionPosteriorState` row for the experiment (`ConditionPosteriorStateRepository.findByConfigId(state.configId)`) after buffering the incoming reward, and — once that sum reaches `batchSize` — flushing every condition's pending buffer (not just the one that tipped it over), so a low-volume condition still gets its pending counts folded in as soon as the shared batch closes.

- **`warmupThreshold` undercounted rewards sitting in an unflushed batch**: `ExperimentAssignmentService.assignThompsonSampling()` computed `totalRewardCount` as `sum(ConditionPosteriorState.totalCount)` across conditions, which is correct only when `batchSize` is unset/≤1 (immediate apply). Once batching is active, a reward is "collected" (persisted to `ThompsonSamplingReward`, buffered in `pendingTotalCount`) before it's folded into `totalCount` — so with a large `batchSize`, warmup could stay active far longer than the actual evidence collected would justify, since pending rewards across all conditions weren't counted at all. Fixed by summing `state.totalCount + state.pendingTotalCount` across conditions, consistent with the reward-evidence semantics the earlier `warmupThreshold` fix (above) already established: warmup should track how much reward evidence has actually arrived, not how much of it has been flushed into the posteriors yet.

- **`POST /v6/reward` is now fire-and-forget, with the config lookup cached**: this endpoint sat on the client's response path doing 8-10 sequential, uncached DB round trips (config lookup, enrollment lookup, audit insert, posterior increments, and — when a batch closes — a flush per condition) even though nothing in the client SDK waits on the result to make a UI decision. `ThompsonSamplingRewardService.recordReward()` was split into `acceptReward()` (public, synchronous — returns a "received and is being processed" receipt immediately) and `processReward()` (private, does the actual work in the background via `acceptReward().catch(...)`, never awaited by the controller). A failure that used to become a `409`/`500` HTTP response is now only logged: `logAndAbort()` (renamed from `throwConflictError()`) logs and throws an internal `RewardProcessingAborted` sentinel purely for control flow, which `acceptReward()`'s catch recognizes and does not re-log (an error of any other type gets one generic "Unexpected error processing..." log line). The `/v6/reward` swagger doc's `200` response and description were updated to describe the receipt/async-logging contract, and its `409`/`500` response entries were removed since nothing throws to the HTTP layer here anymore. Separately, `findConfigById`/`findConfigByDecisionPoint` now go through `CacheService.wrap()` under a new `CACHE_PREFIX.THOMPSON_SAMPLING_CONFIG_KEY_PREFIX` (bucketed under the existing `experiments` TTL/refresh-threshold config in `CacheService`'s `PREFIX_CATEGORY` map) — the same `wrap()`-based pattern `ExperimentService.getCachedValidExperiments()` already uses, since `warmupThreshold`/`minimumDrawDifference`/`batchSize` and the joined `experiment.state` only change on an admin edit, far less often than rewards arrive. `ThompsonSamplingExperimentCrudService.createConfig()`/`updateConfig()` call a new `invalidateConfigCache()` (`cacheService.resetPrefixCache(CACHE_PREFIX.THOMPSON_SAMPLING_CONFIG_KEY_PREFIX)`) after writing — a full-prefix reset rather than a single-key delete, because the decision-point-keyed cache entries embed the same config fields and there's no cheap way to know which `context:site:target` keys reference a given experiment (same blunt-but-safe approach `ExperimentService.updateList()` already takes with `EXPERIMENT_KEY_PREFIX` for the analogous problem). `syncConditions()` does not invalidate, since it only touches `conditionPosteriorStates`, which these cached config objects don't include. One accepted gap: `ExperimentService.updateState()` (experiment start/stop) does not invalidate this cache, so a just-stopped experiment can still accept a reward for up to the `experiments` bucket's TTL — the same TTL-bounded staleness `getCachedValidExperiments()` already tolerates for the assignment path.

- **`minimumDrawDifference` verified against MoocLet's `tspostdiff_thresh`**: confirmed the full plumbing is live (frontend form → `ThompsonSamplingConfigValidator` (`0`–`1`) → `ThompsonSamplingExperimentConfig.minimumDrawDifference` → `ExperimentAssignmentService.assignThompsonSampling()` → `ThompsonSamplingService.selectCondition()`'s fallback check) and matches the reference policy's intent. `ts_postdiff_sample`/`thompson_sampling_postdiff` in `policies.py` draw one Beta sample per arm, and if `abs(draw_1 - draw_2) < tspostdiff_thresh`, fall back to uniform random across all arms instead of picking the highest draw — a hedge against picking a "winner" whose lead over its closest rival is really just sampling noise. But that reference implementation is hardcoded for exactly 2 arms (`thompson_sampling_postdiff`'s own docstring: "Assumes only 2 versions"; `ts_postdiff_sample` reuses the same logic unchanged, indexing `list(versions_dict.values())[0]`/`[1]` regardless of how many conditions exist) — with 3+ arms it silently compares whichever two conditions happen to be first in dict order, not the two that are actually closest, and its `else` branch re-draws every arm from scratch for the real pick rather than reusing the draws the diff check already made. `selectCondition()` doesn't have either problem: it draws once per condition, sorts, and compares `draws[0]` vs `draws[1]` (the actual top two by sampled value, however many conditions there are) before reusing that same top draw as the pick — the correct N-arm generalization of the same idea, not a port of the 2-arm-specific code. Added a test (`ThompsonSamplingService.test.ts` → "compares the top two draws by value, not the first two conditions by list order") that would fail under a MoocLet-style hardcoded-first-two comparison but passes under the current top-two-by-value implementation.

- **Bulk import/batch-create never created a Thompson Sampling config**: `ImportExportService.addBulkExperiments()` (the shared path behind both `/experiments/import` and `/experiments/batch`) called `experimentService.create()` directly with no reference to `ThompsonSamplingExperimentCrudService` — config/posterior-state creation existed only in `ExperimentController.create()`/`update()`. An imported or batch-created `THOMPSON_SAMPLING` experiment got an `Experiment` row but no `ThompsonSamplingExperimentConfig`/`ConditionPosteriorState` rows, so `assignThompsonSampling()` would log an error and return `undefined` for every user, forever. Fixed by moving the per-call-site `if (assignmentAlgorithm === THOMPSON_SAMPLING) {...}` gating (previously duplicated across the controller's `create()`/`update()`/`one()`) into three orchestration methods on `ThompsonSamplingExperimentCrudService`: `createConfigIfApplicable()`, `syncConfigIfApplicable()`, and `attachConfigToExperiment()` (which replaced the controller's private `attachThompsonSamplingConfig()`). `ImportExportService.addBulkExperiments()` and `exportExperiment()` now call these too, so import, batch-create, and export get the same config handling as the single-experiment `POST`/`PUT`/`GET` endpoints. Reward data can't leak through this path regardless of caller: `ThompsonSamplingConfigParams`/`createConfig()` have no field for `successCount`/`failureCount`, so posterior state always starts at Beta(priorSuccess, priorFailure) with zero counts, whatever the source experiment (e.g. one round-tripped through export) had accumulated.

- **`ConditionRewardSummary.conditionCode` actually held a `conditionId`**: every caller populated it with a condition UUID, never an actual (nullable) `conditionCode`. Renamed the field to `conditionId`, and renamed `ThompsonSamplingService.selectCondition()`'s `conditionCodes` parameter (and its private `uniformRandom()` helper) to `conditionIds`/`conditionId` throughout, so the algorithm-facing types now say what they actually hold. `ThompsonSamplingExperimentCrudService.getRewardsSummary()`'s own `conditionCode`/`code` fields are unrelated and untouched — those hold (or fall back to) a real display-facing condition code, a different concept from the algorithm's internal `conditionId` key.

- **Beta posterior formula and priors-record construction were duplicated**: `alpha = prior.success + successCount` / `beta = prior.failure + failureCount` was written independently in both `ThompsonSamplingService.selectCondition()` and `ThompsonSamplingExperimentCrudService.getRewardsSummary()`; extracted to `ThompsonSamplingService.computePosterior()`, used by both. The `{ [conditionId]: {success, failure} }` priors-record construction was likewise duplicated between `ExperimentAssignmentService.assignThompsonSampling()` and `ThompsonSamplingExperimentCrudService.attachConfigToExperiment()`; extracted to `ThompsonSamplingService.buildPriorsRecord()`.

- **`getRewardsSummary()` built a query directly, violating this package's own layering rule** (`packages/backend/CLAUDE.md`: "repositories own ALL query-building; services never build queries directly"): moved the `createQueryBuilder` call (joining `conditionPosteriorStates` and `condition`) into a new `ThompsonSamplingExperimentConfigRepository.findByExperimentIdWithConditions()` method.

- **Misplaced JSDoc**: the doc comment describing `syncConditions()`'s add/remove-rows behavior was sitting above `getRewardsSummary()` (which is a read-only aggregation with no side effects). Moved to `syncConditions()`; `getRewardsSummary()` got its own accurate doc.

- **`ThompsonSamplingRewardService.applyOrBufferReward()` mixed concerns and duplicated increment logic**: split into `applyOrBufferReward()` (buffers or immediately applies one reward) and `flushIfBatchReady()` (the experiment-wide pending-count check and flush across every condition). The immediate-apply path (`batchSize` unset/≤1) now routes through the same `flushPendingRewards()` a real batch flush uses, instead of a second hand-rolled copy of the `totalCount`/`successCount`/`failureCount` increment sequence.

- **Frontend: duplicate `isThompsonSamplingExperiment()` reimplementation**: `experiment-conditions-section-card.component.ts` and `enrollment-condition-expandable-row.component.ts` each defined a local `isThompsonSamplingExperiment(experiment)` that reimplemented the check via `thompsonSamplingHelperService.isThompsonSamplingAlgorithm(experiment?.assignmentAlgorithm)` instead of calling `ThompsonSamplingHelperService.isThompsonSamplingExperiment(experiment)` — an existing method of the same name/purpose. Both local methods now delegate to it directly (kept as thin per-component wrappers only because their templates already call them by that name in several places).

- **Frontend: duplicated adaptive-weight tooltip translation key**: the `'experiments.details.conditions.weight-adaptive-tooltip.text'` literal was duplicated 4 times across `experiment-conditions-table.component.html` and `enrollment-condition-expandable-row.component.html`. Extracted to `THOMPSON_SAMPLING_WEIGHT_TOOLTIP_KEY` in `experiments.model.ts`, referenced from both components' `.ts` files and bound in the templates instead of the literal string. The two Angular Material table structures themselves stay separate (one is a static `matColumnDef` table, the other a dynamic per-key loop over `displayedColumns`), so this only removed the duplicated literal, not the surrounding markup — the `matTooltip`/`matTooltipDisabled`/`matTooltipPosition` attribute repetition is this codebase's established idiom for every tooltip, adaptive-weight or not.

- **Extensibility analysis, and the low-risk pieces of it that were implemented**: a follow-up analysis (`adaptive-algorithm-extensibility-analysis.md`) scoped what to change now vs. wait on, given the expectation of at most 2-3 adaptive algorithms ever, not a general plugin framework. Two "do now" items:
  - **Backend config CRUD dispatch (done)**: `ThompsonSamplingExperimentCrudService`'s three self-gated methods (`createConfigIfApplicable`, `syncConfigIfApplicable`, `attachConfigToExperiment`) were extracted into an `AdaptiveExperimentConfigService` interface (`src/api/services/AdaptiveExperimentConfigService.ts`). A new `AdaptiveExperimentConfigDispatcherService` holds an array of implementations (today just Thompson Sampling's) and loops over it for each of the three methods; `ExperimentController` (`one()`, `create()`, `update()`) and `ImportExportService` (`addBulkExperiments()`, `exportExperiment()`) now call the dispatcher instead of `ThompsonSamplingExperimentCrudService` directly. `ExperimentController.thompsonSamplingCrudService` is still injected and used directly only for `GET /experiments/rewards/:id` (`getRewardsSummary()`), which isn't part of the three-method interface and stays Thompson-Sampling-specific. Adding algorithm #2's config service means adding it to the array in `AdaptiveExperimentConfigDispatcherService`'s constructor — no call-site changes.
  - **Frontend swappable config form (already satisfied, no change needed)**: the analysis recommended extracting a standalone Thompson-Sampling-specific form component with a small `[existingConfig]`/`(configChange)`/`(validityChange)`-style contract, swapped in by a `@switch` on `assignmentAlgorithm`. Checked `upsert-experiment-modal.component.ts`/`.html` and found this already exists — `TsConfigurablePolicyParametersFormComponent` (`.../upsert-experiment-modal/ts-configurable-policy-parameters-form/`) is a standalone component with exactly that contract (`@Input existingPolicyParams`/`disabled`, `@Output parametersChange`/`validationChange`/`formChanged`), hosted behind a single `@if (assignmentAlgorithmValue === ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING)` in the parent modal. A single `@if` is simpler than `@switch` for one case and converts trivially to `@switch`/`@else if` when algorithm #2 needs its own form component — not worth doing preemptively.
  - **Left alone, per the analysis**: the reward pipeline split (waits for a second reward-consuming algorithm to know its real shape), the conditions-table column-swapping, renaming the Thompson-Sampling-named tables/summary shape to something generic, and any dynamic component/plugin registry. Same reasoning as the original "no shared interface" note below still applies to the *assignment/reward* seam — only the config-CRUD seam was formalized.
- **Deliberately not fixed — no shared interface for the assignment/reward seam**: the only seam for a *second* adaptive algorithm's assignment and reward handling is still a hardcoded `if (assignmentAlgorithm === THOMPSON_SAMPLING)` check in `ExperimentAssignmentService`, `ExperimentDTO`, and the reward endpoint (the config-CRUD seam described above is now the exception). Left unresolved on purpose — it's a larger architectural change, out of scope for this cleanup pass, and worth designing deliberately once a second algorithm is actually on the table rather than guessing its shape now.

- **Copilot code-review fixes**: a Copilot review of this branch surfaced 24 comments; after checking each against the current code (several were already stale, having been posted against earlier commits), 8 were live, ranked, and fixed:
  - **Algorithm-transition asymmetry, both directions**: `ThompsonSamplingExperimentCrudService.syncConfigIfApplicable()` previously assumed a config already existed on update. Switching an experiment *to* Thompson Sampling via edit never created one (assignment silently broke forever); switching *away from* it never deleted the old one (the reward endpoint could keep treating a now-non-adaptive experiment as Thompson Sampling). Fixed both: creates the config if missing when switching in, deletes it via a new `deleteConfigIfExists()` when switching out. `ThompsonSamplingExperimentConfigRepository.findByDecisionPoint()`/`findConfigsForActivelyEnrollingExperiments()` also gained an `assignmentAlgorithm` filter as defense-in-depth against any config row that outlives the delete.
  - **Concurrent reward race**: `applyOrBufferReward()`/`flushPendingRewards()` used separate increment/read/reset calls with no locking, so two rewards for the same experiment arriving close together could double-apply or lose pending counts. Rewritten to run inside one transaction taking a `pessimistic_write` lock (ordered by id) across every `ConditionPosteriorState` row for the config before mutating any of them.
  - **Thompson Sampling + Within-Subjects**: Within-Subjects assignment never stores a condition on the individual enrollment (tracked per-repeat via `RepeatedEnrollment` instead), so Thompson Sampling's reward path — which reads that enrollment's `conditionId` — could never succeed for that combination, and nothing rejected it. Added `IsAssignmentAlgorithmCompatibleWithUnit()` to `ExperimentDTO` (backend) and disabled/auto-reset the Thompson Sampling option when Within-Subjects is selected in `upsert-experiment-modal.component.ts` (frontend).
  - **No rollback on partial create failure**: `ExperimentController.create()` and `ImportExportService.addBulkExperiments()` committed the `Experiment` row before creating its adaptive config; a config-creation failure left an orphaned, permanently-broken experiment behind. Both now delete the just-created experiment if `createConfigIfApplicable()` throws.
  - **`getRewardsSummary()` weight-map collision**: was keyed by `conditionCode`, which has no uniqueness constraint (only `ExperimentCondition.twoCharacterId` is unique) — two conditions sharing a code would collide and one would silently show the other's `estimatedWeight`. Now keyed by `conditionId`, matching the pattern the algorithm-facing code already uses for the same reason.
  - **`updateConfig()` nulling out omitted fields**: `params.field ?? null` cleared any field a partial payload omitted. Now only fields actually present in `params` are included in the update.
  - **`isTSFormValid$` stuck after leaving Thompson Sampling**: if the TS sub-form was invalid at the moment the algorithm was switched away, the child component was destroyed without emitting a final validity event, permanently disabling Save. `checkForAlgorithmChange()`'s else-branch now resets `isTSFormValid$`/`isTSFormChanged$`.
  - Not fixed (explicitly out of scope, per this branch's data): the migration's default/zero-seeded posterior state for remapped `ts_configurable` experiments — no such experiments exist in the environments this migrates to.

### Architecture notes

- **conditionId as algorithm key**: `ThompsonSamplingService.selectCondition()` uses condition UUIDs (not `conditionCode`) as identifiers, since `conditionCode` is nullable. `ConditionPosteriorState` rows, `ConditionRewardSummary.conditionId`, and `selectCondition()`'s own `conditionIds` parameter are all named and keyed accordingly. The `priors` field in `ThompsonSamplingConfigDTO` is therefore also keyed by conditionId.

- **Reward summary endpoint**: `GET /experiments/rewards/:id` delegates to `ThompsonSamplingExperimentCrudService.getRewardsSummary()`, which calls `ThompsonSamplingExperimentConfigRepository.findByExperimentIdWithConditions()` to load `ConditionPosteriorState` rows joined to their conditions, computes `successes`, `failures`, `successRate`, `priorSuccess`, `priorFailure` per condition (via the shared `ThompsonSamplingService.computePosterior()`), and sorts by condition order. Fully implemented.
