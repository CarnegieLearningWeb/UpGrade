# Implementation Plan: Mark Path Correctness Refactor — Pooling Logic Consolidation & Context-Aware Caching

## Rationale

This refactor addresses three related correctness problems in the mark path.

### 1. Pooling logic divergence between assign and mark

`getAllExperimentConditions` (the assign path) applies a full pipeline: global exclusion → group-experiment filtering → experiment-level inclusion/exclusion → `processExperimentPools`. Before this refactor, `markExperimentPoint` did none of that — it fetched decision points from a separate cache and performed ad-hoc filtering. This meant assign and mark could disagree on which experiment a user was enrolled in, leading to incorrect or mismatched mark records.

Consolidating the selection logic into `resolveExperimentForMarkPoint` — a shared private method that mirrors the assign pipeline — guarantees the two paths always agree.

### 2. Missing `context` on mark requests

`context` is a required, client-supplied identifier that scopes all experiment activity. The assign path has always required it. The mark path never received it, which caused two downstream problems:

- **Cross-context cache contamination** — the mark cache key `MARK_KEY_PREFIX-{site}-{target}` has no context dimension, so experiments from different contexts sharing a site/target can collide in the cache.
- **Derived context is fragile** — the service was inferring context from the first cached experiment (`allExperimentsAtDP[0]?.context?.[0]`), which is undefined when the cache is empty and wrong if experiments from multiple contexts are present.

Requiring `context` on mark requests makes the contract explicit, eliminates the derivation hack, and allows mark to use the same `EXPERIMENT_KEY_PREFIX-{context}` cache as assign.

### 3. No state filter on the mark cache query

`DecisionPointRepository.find()` returns experiments in any state (e.g., `CANCELLED`, `PREVIEW`). Switching to `getCachedValidExperiments(context)` — which uses `getValidExperimentsForContextAndDecisionPoint` under the hood — ensures only `ENROLLING` and `ENROLLMENT_COMPLETE` experiments are considered, matching the assign path's behavior.

### Cache strategy

Replacing the mark-specific cache with the shared `EXPERIMENT_KEY_PREFIX-{context}` cache eliminates a redundant DB query pattern and removes a stale cache key. Mark does a cheap in-memory filter over the cached experiments to find those relevant to the given `site`/`target`. The 60-second production TTL is not a concern in practice because there is no mark-only traffic — assign reliably warms the cache before mark is called in the normal usage pattern. A cold mark fetch (e.g., after TTL expiry or a server restart) is heavier than before since it loads all experiments for the context rather than only the DPs for a single site/target, but at ~74 experiments this is not a meaningful concern.

---

## Phase 0 — Backend: Pooling Logic Consolidation ✅ COMPLETED

**File:** `ExperimentAssignmentService.ts`

Prior to this plan, `markExperimentPoint` used a simple cache lookup and did not apply the same experiment-selection logic as `getAllExperimentConditions`. This meant the two methods could disagree on which experiment a user was enrolled in.

The following work has already been completed:

1. Extracted `resolveExperimentForMarkPoint(site, target, experimentId, userDoc, previewUser, logger)` — a private method that contains the full filtering and pooling pipeline mirroring `getAllExperimentConditions`:
   - Global user/group exclusion check
   - When `experimentId` is provided: validates it exists at the decision point, then runs experiment-level inclusion/exclusion
   - When `experimentId` is absent: runs group-experiment filtering → experiment-level inclusion/exclusion → `processExperimentPools`, returning the single selected experiment
2. `markExperimentPoint` now delegates to `resolveExperimentForMarkPoint` instead of doing ad-hoc filtering inline
3. The indirect group exclusion save and all downstream enrollment/monitoring logic now operates on the correctly resolved experiment

This guarantees that mark and assign always agree on the selected experiment for a given user and decision point.

---

## Phase 1 — Backend: Validators ✅ COMPLETED

**Files:** `MarkExperimentValidator.v5.ts`, `MarkExperimentValidator.v6.ts`

- Add `@IsString() @IsNotEmpty() context: string` to `MarkExperimentValidatorv6` (required — v6 is the current client-facing version)
- Add `@IsString() @IsOptional() context?: string` to `MarkExperimentValidatorv5` (optional — for backward compatibility with older clients)

---

## Phase 2 — Backend: Service ✅ COMPLETED

**File:** `ExperimentAssignmentService.ts`

1. Add `context: string` parameter to `markExperimentPoint`
2. Thread `context` down into `resolveExperimentForMarkPoint`
3. In `resolveExperimentForMarkPoint`:
   - Replace `getCachedExperiments(site, target)` with `experimentService.getCachedValidExperiments(context)` (same call used by the assign path)
   - Add in-memory filter: `allExperimentsForContext.filter(exp => exp.partitions.some(p => p.site === site && p.target === target))`
   - Remove the `context` derivation hack (`allExperimentsAtDP[0]?.context?.[0]`) — it will now be a first-class parameter
4. Update `resolveExperimentForMarkPoint` return type — remove `dpExperiments: DecisionPoint[]` from the return shape
5. In `markExperimentPoint`, replace `dpExperiments.find(dp => dp.experiment.id === experimentId)` with `experiments[0]?.partitions.find(p => p.site === site && p.target === target)` for `selectedExperimentDP`
6. Delete the `getCachedExperiments` private method entirely
7. Remove `MARK_KEY_PREFIX` import/usage

---

## Phase 3 — Backend: Controllers ✅ COMPLETED

**Files:** `ExperimentClientController.v6.ts`, `ExperimentClientController.v5.ts`

- Thread `experiment.context` from the validated body into the `markExperimentPoint` service call in both controllers
- For v5, pass a fallback (e.g., `experiment.context ?? ''`) since the field is optional in that version

---

## Phase 4 — Backend: Cache Cleanup ✅ COMPLETED

**File:** `ExperimentService.ts` — `clearExperimentCacheDetail` private method

- Remove the `delCache(MARK_KEY_PREFIX + '-' + partition.site + '-' + partition.target)` loop — that key no longer exists
- The method body simplifies to just `delCache(EXPERIMENT_KEY_PREFIX + context)`

---

## Phase 5 — JS Client Library ✅ COMPLETED

**Files:** `UpGradeClient.types.ts`, `types/requests.ts`, `ApiService.ts`, `UpgradeClient.ts`, `Assignment.ts`

1. `IMarkDecisionPointParams` — add `context: string`
2. `IMarkDecisionPointRequestBody` — add `context: string` at the top level of the request body
3. `ApiService.markDecisionPoint` — include `context` in the built `requestBody`
4. `UpgradeClient.markDecisionPoint` — pass the stored context (already available via the `ApiService` constructor config) into the params object
5. `Assignment.markDecisionPoint` — `Assignment` currently has no direct reference to `context`; the `ApiService` already holds it, so `ApiService.markDecisionPoint` can read it internally from `this.context` without changing the `Assignment` public API

---

## Phase 6 — Java Client Library ✅ COMPLETED

**Files:** `MarkExperimentRequest.java`, `ExperimentClient.java`

1. `MarkExperimentRequest.java` — add `context` field with getter/setter and update all constructors to include it
2. `ExperimentClient.java` — all six `markDecisionPoint` overloads delegate to the private `markDecisionPoint(status, data, clientError, uniquifier, callbacks)` method; add `this.context` to the `MarkExperimentRequest` construction in that private method. No public API changes needed.

---

## Phase 7 — Integration Tests

**Files:** `packages/backend/test/integration/Experiment/markExperimentPoint/**`

- Update all `markExperimentPoint` test utility calls to include `context`
- Verify the no-experiment and with-experiment paths still pass

### New tests to add

#### 7a. State filter — testable against the unfixed code (demonstrates bug, then verifies fix) ✅ COMPLETED

This is the cleanest test to write before Phases 1–4 are complete, since it doesn't require the `context` wire changes to observe the behavioral difference.

**Setup:**

1. Create an experiment at `site`/`target`, put it into `ENROLLING`
2. Transition the experiment to `CANCELLED`
3. Call `markExperimentPoint` at the same `site`/`target`

**Before fix:** The cancelled experiment appears in the mark result (no state filter on `DecisionPointRepository.find()`).  
**After fix:** The experiment is excluded — `getCachedValidExperiments` filters by state, so no experiment is found and the mark records no enrollment.

---

#### 7b. Context contamination — testable once Phase 1 adds `context` to the wire format ✅ COMPLETED

**Setup:**

1. Create experiment A in `context="math"`, `site="homepage"`, `target="button"`
2. Create experiment B in `context="science"`, `site="homepage"`, `target="button"`
3. Mark user 1 with `context="math"` at `site="homepage"`, `target="button"`
4. Mark user 2 with `context="science"` at the same `site`/`target`

**Before fix:** `DecisionPointRepository.find({ where: { site, target } })` has no context filter, so both experiments A and B are included in the pool for any mark at that decision point. With no basis to exclude the wrong experiment, a user marking in context "math" may have experiment B selected — regardless of whether the result was cached or freshly queried. The cache makes this wrong behavior more consistent but is not the root cause.  
**After fix:** `getCachedValidExperiments(context)` scopes the fetch to the given context before any filtering, so experiment B is never in the pool when marking for context "math". User 1's mark correctly references experiment A and user 2's references experiment B.

---

#### 7c. Pooling regression — verifies correct behavior is preserved (Phase 0)

Since pooling consolidation is already complete, this test documents the now-correct behavior and would catch a regression if the code were reverted.

**Setup:**

1. Create two experiments in the same pool at `site`/`target`, where pool assignment logic selects experiment A for user 1
2. Call `getAllExperimentConditions` for user 1 → verify experiment A is assigned
3. Call `markExperimentPoint` for user 1 at the same `site`/`target` with no `experimentId`

**Assert:** The mark record's `experimentId` matches the experiment returned by assign (experiment A). Under the old code, mark used ad-hoc filtering rather than `processExperimentPools` and could select a different experiment.

---

## Order Dependencies

Phases 1–4 are purely backend and can be done together. Phase 5 (JS) and Phase 6 (Java) depend on Phases 1–4 being finalized so the wire format is stable before client changes are made. Phase 7 follows Phases 1–4.
