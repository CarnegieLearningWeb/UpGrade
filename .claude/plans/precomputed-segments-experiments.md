# Plan: Precomputed Segment Lists for Experiments

Port the feature-flag precomputed segment list pattern to experiments.
The feature-flag implementation is complete and stable — it merged to `dev` via
`wip/precomputed-segments-for-flags` (PR #3198) and has since been renamed and hardened.
This plan targets the **finalized** feature-flag code as its reference, not the original draft.

> **This is no longer a naive 1:1 copy.** Per the decisions below, the shared computation logic
> is being **extracted into a common base** that both the feature-flag and experiment services
> reuse. That means this work touches the finalized, stable feature-flag code — every change on
> the flag side must be behavior-preserving and keep the existing feature-flag tests green.

## Background

Experiments currently resolve segment inclusion/exclusion **on-the-fly at assignment time** via recursive `resolveSegment()` calls in `ExperimentAssignmentService`. This is the same slow path that feature flags moved away from. The goal is to precompute flat `inclusionIds[]` / `exclusionIds[]` arrays per experiment, stored in a new `experiment_precomputed_segment` table, so the assignment path becomes a fast in-memory `Set.has()` check.

Key difference from feature flags: experiment join tables (`ExperimentSegmentInclusion`, `ExperimentSegmentExclusion`) have **no `enabled` column** — all rows are active. The `where: { enabled: true }` filter in `recomputeForFlag` does not apply here, and there is **no experiment analog of feature flags' `updateListStatus` (enabled-toggle) trigger.**

---

## Architecture decisions (resolved)

These were confirmed before writing the plan and drive the phases below:

1. **Shared base service.** Instead of a standalone `ExperimentPrecomputedSegmentService` that duplicates the flag service, factor the domain-agnostic logic into a common base that both `FeatureFlagPrecomputedSegmentService` and a new `ExperimentPrecomputedSegmentService` extend. The base owns the orchestration (`withRecompute`, `getPrecomputedSets`, `backfillMissing`, `recompute`, the affected-owner traversal, `seedEmptyRow`); subclasses supply the domain-specific seams (join repositories, precomputed repository, owner-id column, cache prefix, `enabled` filter, log labels).
2. **Shared module for pure helpers.** Move `flattenSegmentMembers`, `precomputedGroupKey`, and `PRECOMPUTED_GROUP_DELIMITER` out of the flag service into a shared module both services (and the read paths) import.
3. **Experiments have an import path.** `ExperimentService.importExperimentLists` is the analog of `importFeatureFlagLists` and must **`await` the recompute** so "import complete" means the precomputed rows are ready (mirrors the flag import contract).
4. **Seed an empty row on experiment creation.** Mirror `seedEmptyRowForFlag`: seed an empty `experiment_precomputed_segment` row inside the experiment-creation transaction so the read path never misses a freshly created experiment.

---

## Naming convention

The finalized feature-flag code uses the `<Domain>PrecomputedSegment` ordering everywhere. The experiment port mirrors it:

| Concept | Feature flag (reference) | Experiment (this work) |
|---|---|---|
| Entity / file | `FeatureFlagPrecomputedSegment` | `ExperimentPrecomputedSegment` |
| Repository | `FeatureFlagPrecomputedSegmentRepository` | `ExperimentPrecomputedSegmentRepository` |
| Service | `FeatureFlagPrecomputedSegmentService` | `ExperimentPrecomputedSegmentService` |
| Table | `feature_flag_precomputed_segment` | `experiment_precomputed_segment` |
| Migration | `<ts>-featureFlagPrecomputedSegment.ts` | `<ts>-experimentPrecomputedSegment.ts` |
| Startup backfill | `backfillFeatureFlagPrecomputedSegments` | `backfillExperimentPrecomputedSegments` |
| Cache prefix | `FEATURE_FLAG_PRECOMPUTED_SEGMENT_KEY_PREFIX` (`'featureFlagPrecomputedSegments-'`) | `EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX` (`'experimentPrecomputedSegments-'`) |
| Repo methods | `upsertByFlagId` / `findByFlagIds` | `upsertByExperimentId` / `findByExperimentIds` |

`CACHE_PREFIX` lives in `packages/types/src/Experiment/enums.ts`.

## Files to create

- `src/api/services/PrecomputedSegmentServiceBase.ts` — shared abstract base (extracted from the flag service)
- `src/api/services/precomputedSegmentHelpers.ts` — shared pure helpers (`flattenSegmentMembers`, `precomputedGroupKey`, `PRECOMPUTED_GROUP_DELIMITER`) *(name/location TBD; co-locate near the base)*
- `src/api/models/ExperimentPrecomputedSegment.ts` — entity
- `src/api/repositories/ExperimentPrecomputedSegmentRepository.ts` — repo
- `src/api/services/ExperimentPrecomputedSegmentService.ts` — experiment subclass of the base
- `src/database/migrations/<timestamp>-experimentPrecomputedSegment.ts` — migration
- `src/init/seed/backfillExperimentPrecomputedSegments.ts` — startup backfill

## Files to modify

- `src/api/services/FeatureFlagPrecomputedSegmentService.ts` — refactor to extend the base + import shared helpers (behavior-preserving)
- `src/api/services/FeatureFlagService.ts` — update the read path to import `precomputedGroupKey` from the shared module (behavior-preserving)
- `src/api/services/ExperimentAssignmentService.ts` — replace `resolveSegment()` recursion with a precomputed lookup
- `src/api/services/MoocletExperimentService.ts` — audit: the original experiment attempt touched this alongside the assignment read path; confirm whether the mooclet assignment path also needs updating
- `src/api/services/ExperimentService.ts` — seed-on-create, `withRecompute` on list mutations, awaited recompute on import
- `src/api/services/SegmentService.ts` — extend the existing segment-side triggers to also recompute experiments
- `src/app.ts` — wire startup backfill (guarded, mirroring the flag backfill's crash-safe `.catch`)
- `packages/types/src/Experiment/enums.ts` — add `EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX`
- `packages/backend/CLAUDE.md` — add an experiment section mirroring the feature-flag one

---

## Phase 0 — Extract the shared base + helper module (feature-flag side, behavior-preserving)

Do this **first**, as a pure refactor with no experiment code yet, so the feature-flag tests act as a regression guard before anything experiment-specific is added.

1. **Shared helper module** — move out of `FeatureFlagPrecomputedSegmentService`:
   - `PRECOMPUTED_GROUP_DELIMITER = ':'`
   - `precomputedGroupKey(type, groupId)` → `` `${type}:${groupId}` ``
   - `flattenSegmentMembers(segmentRepository, segmentIds, seen)` — currently a private method that depends only on `segmentRepository` + `precomputedGroupKey`; convert to a free function taking the repository (or a static on the base).

   Update the flag service **and** `FeatureFlagService` (read path) to import `precomputedGroupKey` from the new module.

2. **Abstract base service** — extract the domain-agnostic orchestration into `PrecomputedSegmentServiceBase`:
   - Concrete on the base: `withRecompute`, `scheduleRecomputeForSegment`, `scheduleRecomputeForOwners` (generalized `scheduleRecomputeForFlags`), `getPrecomputedSets`, `backfillMissing`, `recompute`, `seedEmptyRow`, `getAffectedOwnerIds` / `collectAffectedOwnerIds` (generalized `getAffectedFlagIds` / `collectAffectedFlagIds`).
   - Abstract seams the subclass supplies:
     - the precomputed repository (`upsertByOwnerId`, `findByOwnerIds`) and the owner repository
     - the inclusion/exclusion join repositories
     - a hook to fetch inclusion/exclusion segment IDs for an owner (this is where the flag subclass applies `enabled: true` and the experiment subclass does **not**)
     - a hook to fetch owner IDs referencing a segment (drives `collectAffectedOwnerIds`)
     - the cache prefix and log-label strings

3. **Refactor `FeatureFlagPrecomputedSegmentService`** to `extends PrecomputedSegmentServiceBase`, implementing the seams. Public method names on the flag service stay identical (`recomputeForFlag`, `scheduleRecomputeForFlags`, `getAffectedFlagIds`, etc.) — either as thin wrappers over the base or via the base's generic names, whichever keeps call sites and tests unchanged.

4. **Run the feature-flag test suite** (`FeatureFlagPrecomputedSegmentService.test.ts`, `FeatureFlagService.test.ts`, `SegmentService.test.ts`) and confirm green before proceeding.

### Base seam interface (Phase 0 deliverable)

Target shape for `PrecomputedSegmentServiceBase`. Concrete orchestration lives on the base; the
subclass implements the abstract seams. Domain-named public methods on each subclass
(`recomputeForFlag`, `recomputeForExperiment`, …) are thin wrappers over the base so existing
call sites and tests are untouched.

```ts
export abstract class PrecomputedSegmentServiceBase<
  TEntity extends { inclusionIds: string[]; exclusionIds: string[] }
> {
  // --- seams the subclass supplies ---
  protected abstract readonly cachePrefix: CACHE_PREFIX;      // e.g. FEATURE_FLAG_PRECOMPUTED_SEGMENT_KEY_PREFIX
  protected abstract readonly logLabel: string;               // e.g. 'feature_flag_precomputed_segment'
  protected abstract readonly segmentRepository: SegmentRepository;
  protected abstract readonly cacheService: CacheService;

  protected abstract findAllOwnerIds(): Promise<string[]>;                 // backfill / recompute-all
  protected abstract findExistingOwnerIds(): Promise<string[]>;            // backfill diff

  // inclusion/exclusion segment IDs + filterMode for one owner.
  // FF applies `enabled: true` on the join rows; experiments do NOT (no enabled column).
  // filterMode drives the "don't precompute unused data" optimization below.
  protected abstract getListsForOwner(
    ownerId: string
  ): Promise<{ inclusionSegmentIds: string[]; exclusionSegmentIds: string[]; filterMode: FILTER_MODE }>;

  protected abstract findOwnerIdsBySegmentId(segmentId: string): Promise<string[]>;  // affected-owner walk
  protected abstract upsert(ownerId: string, inclusionIds: string[], exclusionIds: string[]): Promise<void>;
  protected abstract findByOwnerIds(ownerIds: string[]): Promise<(TEntity | null)[]>; // order-aligned, null for miss
  protected abstract insertEmptyRow(ownerId: string, manager: EntityManager): Promise<void>;

  // --- concrete orchestration on the base ---
  public async recompute(ownerId: string, logger: UpgradeLogger): Promise<void>;
  public async seedEmptyRow(ownerId: string, manager: EntityManager): Promise<void>;
  public scheduleRecomputeForSegment(segmentId: string, logger: UpgradeLogger): void;
  public scheduleRecomputeForOwners(ownerIds: string[], logger: UpgradeLogger): void;
  public async withRecompute<T>(
    logger: UpgradeLogger,
    resolveAffectedOwnerIds: () => string[] | Promise<string[]>,
    work: () => Promise<T>
  ): Promise<T>;
  public async getPrecomputedSets(ownerIds: string[]): Promise<Map<string, TEntity>>;
  public async backfillMissing(logger: UpgradeLogger): Promise<void>;
  public async recomputeAll(logger: UpgradeLogger): Promise<void>;
  public async getAffectedOwnerIds(segmentId: string): Promise<string[]>;
  protected async collectAffectedOwnerIds(segmentId: string, visited: Set<string>): Promise<Set<string>>;
}
```

Subclass wrappers (example, feature flag):
`recomputeForFlag = recompute`, `scheduleRecomputeForFlags = scheduleRecomputeForOwners`,
`getAffectedFlagIds = getAffectedOwnerIds`, `seedEmptyRowForFlag = seedEmptyRow`.

---

## Phase 0.5 — Don't precompute or cache data that won't be read (cross-cutting) — DEFERRED

> **Status: SEMANTICS RESOLVED (option B, read-path only); storage trimming still deferred.**
> Product confirmed: `INCLUDE_ALL` is not an explicit inclusion, so include lists (individual **and**
> group) are ignored entirely for `INCLUDE_ALL` — only exclusion applies, and an individually-included
> user whose group is excluded is still excluded. This is now enforced consistently in
> `ExperimentAssignmentService.inclusionExclusionLogic` (INCLUDE_ALL branch no longer reads the
> individual/group inclusion lists) and `FeatureFlagService.featureFlagLevelInclusionExclusion` (the
> individual-inclusion short-circuit now applies only to `EXCLUDE_ALL`), fixing the prior
> precomputed-vs-fallback disagreement. `EXCLUDE_ALL` is unchanged.
>
> The precomputed rows still store the full inclusion arrays; the read paths simply ignore them for
> `INCLUDE_ALL`, so **no `filterMode`-change recompute is required for correctness**. The remaining
> deferred work is purely an optimization: trimming the unread inclusion members from `INCLUDE_ALL`
> rows (the `flattenSegmentMembers` split in options A/B below). Not required for correctness.

**Finding (confirmed in the finalized FF code).** For `INCLUDE_ALL` entities, the flattened inclusion
array's **group** members are never consulted at assignment time:
- `inclusionExclusionLogic` (`ExperimentAssignmentService.ts:2316`) checks individual exclusion →
  individual inclusion → group **exclusion** only for INCLUDE_ALL; it never reads group inclusion.
- The FF precomputed read path (`FeatureFlagService.ts:1085`) returns `!inGroupExclusion` for
  INCLUDE_ALL; `inGroupInclusion` is computed but only used in the EXCLUDE_ALL branch.

Yet `recomputeForFlag` flattens **all** inclusion segments regardless of `filterMode`, stores them in
`inclusionIds`, and `getPrecomputedSets` caches the whole row in memory. So for every INCLUDE_ALL
entity we pay recursive-flatten CPU, row storage, and cache memory for group-inclusion members that
no code reads. (Individual inclusion IDs *are* still read for INCLUDE_ALL — they let a specific user
override a group exclusion — so they must be kept.)

**Latent inconsistency to reconcile.** `resolveFlagsOnTheFly` (`FeatureFlagService.ts:1124`) drops
inclusion **entirely** for INCLUDE_ALL (`includeIds = []`), which disagrees with
`inclusionExclusionLogic` on the "individually-included user who is also in an excluded group" case
(that path would still include them). Whatever semantics we settle on must be applied consistently
across the precomputed path, the on-the-fly fallback, and `inclusionExclusionLogic`.

**Decision required (product semantics) — pick one, then implement it in the shared `recompute`:**
- **(A) Keep individual inclusion for INCLUDE_ALL, drop group inclusion.** Matches today's
  `inclusionExclusionLogic` + precomputed read semantics. `recompute` stores individual inclusion IDs
  but skips group-inclusion members when `filterMode === INCLUDE_ALL`. Fix `resolveFlagsOnTheFly` to
  match (keep individual inclusion instead of `[]`).
- **(B) Ignore inclusion entirely for INCLUDE_ALL.** Simpler and smallest footprint (`inclusionIds: []`),
  matches `resolveFlagsOnTheFly` today, but changes the individual-inclusion-override behavior — must be
  confirmed with product. Then fix `inclusionExclusionLogic` + the precomputed read path to match.

**Implementation notes (both options):**
- To support (A), refactor `flattenSegmentMembers` to return individuals and group keys **separately**
  (e.g. `{ individualIds, groupKeys }`) so `recompute` can compose the stored array per `filterMode`.
  Cleaner than the current merged array and enables the optimization in the shared base.
- `recompute` reads `filterMode` via the `getListsForOwner` seam and conditionally omits the unused
  portion before `upsert`.
- **Correctness guard:** because `filterMode` can change, a `filterMode` change **must** trigger a
  recompute. Verify the flag update path (`updateFeatureFlagInDB → withRecompute`) already covers this,
  and ensure the experiment update path does too (Phase 7). Without this, a flag flipped
  INCLUDE_ALL → EXCLUDE_ALL would serve a truncated inclusion array.
- Apply the same rule symmetrically if any EXCLUDE_ALL case is found to ignore part of exclusion
  (current reading: EXCLUDE_ALL uses both arrays fully, so only INCLUDE_ALL inclusion is trimmable).
- Because `recompute` lives in the shared base, this fix lands for **feature flags and experiments at
  once** — re-run the FF test suite (Phase 0) after changing it, and add explicit INCLUDE_ALL
  cache-shape assertions.

---

## Phase 1 — Entity

**`src/api/models/ExperimentPrecomputedSegment.ts`** — mirror `FeatureFlagPrecomputedSegment`, swapping the FK:

```ts
@Entity()
export class ExperimentPrecomputedSegment extends BaseModel {
  @PrimaryColumn('uuid')
  public experimentId: string;

  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experimentId' })
  public experiment: Experiment;

  @Column('text', { array: true, default: '{}' })
  public inclusionIds: string[];

  @Column('text', { array: true, default: '{}' })
  public exclusionIds: string[];
}
```

`BaseModel` supplies `createdAt`, `updatedAt`, `versionNumber`. Confirm the entities glob in `env.ts` picks up `src/api/models/*.ts` automatically (it does for the flag entity — no change expected).

---

## Phase 2 — Repository

**`src/api/repositories/ExperimentPrecomputedSegmentRepository.ts`** — mirror `FeatureFlagPrecomputedSegmentRepository` (uses the local `@EntityRepository` from `typeorm-typedi-extensions`):

```ts
@EntityRepository(ExperimentPrecomputedSegment)
export class ExperimentPrecomputedSegmentRepository extends Repository<ExperimentPrecomputedSegment> {
  public async upsertByExperimentId(experimentId: string, inclusionIds: string[], exclusionIds: string[]): Promise<void> {
    await this.createQueryBuilder()
      .insert()
      .into(ExperimentPrecomputedSegment)
      .values({ experimentId, inclusionIds, exclusionIds })
      .orUpdate(['inclusionIds', 'exclusionIds', 'updatedAt'], ['experimentId'])
      .execute();
  }

  public async findByExperimentIds(experimentIds: string[]): Promise<(ExperimentPrecomputedSegment | null)[]> {
    if (!experimentIds.length) return [];
    const rows = await this.createQueryBuilder('ps')
      .where('ps.experimentId IN (:...ids)', { ids: experimentIds })
      .getMany();
    return experimentIds.map((id) => rows.find((r) => r.experimentId === id) ?? null);
  }
}
```

---

## Phase 3 — Migration

```bash
npm run migration:generate -- -n experimentPrecomputedSegment
```

Expected: creates `experiment_precomputed_segment` with `experimentId uuid` PK, `inclusionIds text[] DEFAULT '{}'`, `exclusionIds text[] DEFAULT '{}'`, `BaseModel` timestamp/version columns, and FK to `experiment(id) ON DELETE CASCADE`. Match the shape of `1782926517264-featureFlagPrecomputedSegment.ts`. Verify the generated migration before running.

---

## Phase 4 — `ExperimentPrecomputedSegmentService`

**`src/api/services/ExperimentPrecomputedSegmentService.ts`** — `extends PrecomputedSegmentServiceBase`, injecting `ExperimentPrecomputedSegmentRepository`, `ExperimentSegmentInclusionRepository`, `ExperimentSegmentExclusionRepository`, `ExperimentRepository`, `SegmentRepository`, `CacheService`.

Implement the abstract seams:
- **Fetch inclusion/exclusion segment IDs for an experiment** — query the experiment join repos, `relations: ['segment']`, **without** an `enabled` filter.
- **Fetch experiment IDs referencing a segment** — query the experiment join repos by `segment.id`, `relations: ['experiment']` (drives the affected-owner traversal).
- Precomputed repo = `ExperimentPrecomputedSegmentRepository`; owner repo = `ExperimentRepository`.
- Cache prefix = `EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX`; log labels reference `experiment_precomputed_segment`.

Public surface (thin wrappers over the base, matching the flag service's naming style):
`recomputeForExperiment`, `scheduleRecomputeForExperiments`, `scheduleRecomputeForSegment`, `withRecompute`, `getPrecomputedSets`, `backfillMissingExperiments`, `recomputeAllExperiments`, `seedEmptyRowForExperiment`, `getAffectedExperimentIds`.

---

## Phase 5 — `CACHE_PREFIX`

Add to `CACHE_PREFIX` in `packages/types/src/Experiment/enums.ts`:

```ts
EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX = 'experimentPrecomputedSegments-',
```

Rebuild `packages/types` so consumers pick it up.

---

## Phase 6 — `ExperimentAssignmentService` read path

This is the largest behavioral change. Currently `getIncludedAndExcludedExperiments()` → `resolveSegmentsForEntities()` → `resolveSegment()` do recursive DB queries. Replace that with a precomputed lookup that mirrors `FeatureFlagService.featureFlagLevelInclusionExclusion()`:

1. Call `getPrecomputedSets(experimentIds)` (wrap in try/catch — on any read failure, fall back to on-the-fly resolution, mirroring the flag read path's `resolveFlagsOnTheFly`).
2. Build type-qualified group keys from the user's group map via `precomputedGroupKey(type, groupId)` (from the shared module) so they match the namespaced group IDs stored in the flat arrays.
3. Build `Set`s from `computed.inclusionIds` / `computed.exclusionIds` and evaluate with `Set.has()`. **Data shape is flat `string[]`, not `{users, groups}`** — individuals stored bare and matched against `experimentUser.id`; group IDs matched via the namespaced keys. This resolves the original plan's open question about data shape.
4. Any experiment missing a precomputed row falls back to on-the-fly resolution (analog of `resolveFlagsOnTheFly`), logged as a warning.

Methods to audit/update: `getSegmentObject`, `resolveSegmentsForEntities`, `getIncludedAndExcludedExperiments`, `inclusionExclusionLogic`. Keep `inclusionExclusionLogic`'s include/exclude semantics; only the source of the include/exclude sets changes. **Verify current signatures and line numbers** — the earlier draft's line numbers are stale.

**Also audit `MoocletExperimentService`** — the original experiment attempt modified it alongside the assignment read path. Confirm whether the mooclet assignment path consumes the same resolution and needs the equivalent change.

---

## Phase 7 — Write triggers

Wrap experiment list mutations in the base's ordering contract (`withRecompute` = resolve-affected-before → work-commits → fire-and-forget recompute-after), mirroring the flag trigger table. Experiment-side method map (verify current line numbers):

| Event | Method | Trigger |
|---|---|---|
| Experiment created | `ExperimentService.create` | `seedEmptyRowForExperiment(...)` inside the creation transaction (mirror `seedEmptyRowForFlag`) |
| Segment list added to an experiment | `ExperimentService.addList` | `withRecompute` |
| Segment list members updated | `ExperimentService.updateList` | `withRecompute` |
| Segment list removed | `ExperimentService.deleteList` | delegates to `SegmentService.deleteSegment` (which owns the recompute) — mirror the flag delegation |
| Experiment lists imported | `ExperimentService.importExperimentLists` | **`await` recompute** (import contract — rows ready before "complete") |
| Experiment context changed (if it wipes lists) | experiment update path | check whether updating context deletes segment lists the way `updateFeatureFlagInDB` does; if so, `withRecompute` to recompute to empty |
| Experiment `filterMode` changed | experiment update path | While Phase 0.5 is deferred the stored shape does not depend on `filterMode`, so no special handling is needed beyond whatever the normal update path already does (mirror FF). Becomes a hard requirement only if Phase 0.5 is later implemented. |

There is **no** experiment analog of feature flags' `updateListStatus` (no `enabled` column).
`deleteExperiment`: the FK `ON DELETE CASCADE` handles precomputed-row cleanup — no extra work (same as feature flags).

**`SegmentService`** — the segment-side triggers must recompute **both** flags and experiments when shared segment members/structure change. Alongside each existing `featureFlagPrecomputedSegmentService.scheduleRecomputeForSegment` / `getAffectedFlagIds` call, add the experiment-service equivalent:
- `SegmentService.addList` (~445) → also `experimentPrecomputedSegmentService.scheduleRecomputeForSegment`
- `SegmentService.deleteList` (~473) → also `experimentPrecomputedSegmentService.scheduleRecomputeForSegment`
- `SegmentService.deleteSegment` (~499) → the `withRecompute` here must collect **both** affected flag IDs and affected experiment IDs before the delete, and recompute both after commit
- `SegmentService.addSegmentDataWithPipeline` (~1046, guarded by `skipScheduleRecompute`) → also schedule the experiment recompute

*(Line numbers are approximate against the finalized file — locate by method, not line.)*

---

## Phase 8 — Startup backfill (crash-safe)

**`src/init/seed/backfillExperimentPrecomputedSegments.ts`** — mirror `backfillFeatureFlagPrecomputedSegments`: resolve `ExperimentPrecomputedSegmentService` from the `typedi` `Container` and call `backfillMissingExperiments(logger)`.

**`src/app.ts`** — add after the feature-flag backfill in the bootstrap `.then()` chain, **guarded with `.catch()`** exactly like the flag backfill so a missing table never crashes startup:

```ts
.then(() => {
  return backfillExperimentPrecomputedSegments(logger).catch((err) => {
    logger.error({
      message: `experiment_precomputed_segment backfill failed at startup; continuing with on-the-fly fallback: ${err}`,
    });
  });
});
```

The read-path fallback (Phase 6) plus this guard mean a missing/empty table degrades to on-the-fly resolution instead of an outage.

---

## Phase 9 — Tests

- `ExperimentPrecomputedSegmentService.test.ts` — mirror `FeatureFlagPrecomputedSegmentService.test.ts` (recompute, backfill, affected-id traversal, seed-empty, group namespacing).
- Update `ExperimentAssignmentService` / `MoocletExperimentService` tests for the new read path.
- Extend `SegmentService.test.ts` for the added experiment triggers.
- Confirm the base extraction kept **feature-flag** tests green (Phase 0).

---

## Phase 10 — CLAUDE.md

Add a "## Precomputed Segment Lists (Experiments)" section to `packages/backend/CLAUDE.md` mirroring the feature-flag section: entity, service, read path, trigger table, the fire-and-forget-vs-awaited-import distinction, and the recompute-after-commit / collect-before-delete invariant. Note the shared base + helper module so the two domains are documented as one mechanism.
*(Aside: the existing flag section has minor drift — it references `PRECOMPUTED_SEGMENT_KEY_PREFIX` (actual: `FEATURE_FLAG_PRECOMPUTED_SEGMENT_KEY_PREFIX`) and omits `seedEmptyRowForFlag`, `scheduleRecomputeForFlags`, `precomputedGroupKey`, and `resolveFlagsOnTheFly`. Worth fixing while in there.)*

---

## Checklist

- [x] Phase 0: shared helper module (`precomputedSegmentHelpers.ts`) + `PrecomputedSegmentServiceBase` extracted; flag service refactored to extend it; **feature-flag tests green**
- [x] Phase 0.5 (semantics): **RESOLVED — option B.** INCLUDE_ALL ignores include lists entirely (individual + group); only exclusion applies, consistently across all flag/experiment read paths. Tests added for both filter modes. Storage trimming of unread INCLUDE_ALL inclusion members remains an optional, deferred optimization.
- [x] Phase 1: `ExperimentPrecomputedSegment` entity
- [x] Phase 2: `ExperimentPrecomputedSegmentRepository`
- [x] Phase 3: migration written (`1783627365221-experimentPrecomputedSegment.ts`) — **still needs a live `migration:run` to verify**
- [x] Phase 4: `ExperimentPrecomputedSegmentService` (extends base)
- [x] Phase 5: `EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX` added + types rebuilt
- [x] Phase 6: `ExperimentAssignmentService` read path refactored (flat arrays + group namespacing + fallback via `buildExperimentIncludeExcludeData` / `fetchExperimentPrecomputedWithFallback`, reusing `inclusionExclusionLogic`); Mooclet create path handled (`syncCreate` recomputes after commit)
- [x] Phase 7: `ExperimentService` triggers (recompute-on-create, `withRecompute` on add/update, delegated delete, awaited import) + `SegmentService` triggers extended for experiments (add/delete list, `deleteSegment`, `addSegmentDataWithPipeline`)
- [x] Phase 8: startup backfill wired into `app.ts` with crash-safe `.catch`
- [x] Phase 9: `ExperimentPrecomputedSegmentService.test.ts` added; assignment/segment/experiment/mooclet test constructors + DI modules updated; **all 913 backend unit tests green**
- [x] Phase 10: CLAUDE.md updated (experiment section + shared-base note)
- [x] Typecheck passes (frontend + backend)
- [ ] Migration runs cleanly — **not yet run against a DB**
- [ ] Manual smoke test: pre-existing experiment with segment lists shows correct assignment after restart; missing-table/missing-row degrades to on-the-fly resolution without error

### Implementation note — `create` seeding

The plan called for mirroring `seedEmptyRowForFlag` at experiment creation. Because experiments (unlike flags) attach inclusion/exclusion lists *at* creation, an unconditional empty-row seed would be **wrong** (it would mask real lists with a present-but-empty row, which the read path trusts over the fallback). Instead, `ExperimentService.create` **recomputes** the experiment after lists attach (which yields empty arrays for list-less experiments, so it doubles as the seed). `seedEmptyRowForExperiment` still exists on the service for parity/future use, but the create path uses recompute. When `create` runs inside a caller's transaction (`MoocletExperimentService`), the caller recomputes after commit.
