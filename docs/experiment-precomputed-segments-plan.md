# Development Plan: Experiment Precomputed Segments

## Background

Feature flags use a `feature_flag_precomputed_segment` table that pre-flattens all segment inclusion/exclusion members (individuals + namespaced group keys) into two `text[]` columns per flag. On `/featureflag` calls, membership is resolved with in-memory Set lookups rather than recursive DB queries, cutting latency significantly. Experiments currently resolve segments on-the-fly on every `/assign` and `/mark` call via `experimentLevelExclusionInclusion` → `resolveSegmentsForEntities` → `resolveSegment` (recursive DB). This plan ports the same precomputed pattern to experiments.

---

## Key Structural Differences vs. Feature Flags

| | Feature Flags | Experiments |
|---|---|---|
| Segment join models | `FeatureFlagSegmentInclusion`, `FeatureFlagSegmentExclusion` | `ExperimentSegmentInclusion`, `ExperimentSegmentExclusion` |
| `enabled` field on join | Yes — inclusion/exclusion records have `enabled: boolean` | No — all joined segments are always active |
| Additional enrollment skip | No | Yes — GROUP + INDIVIDUAL consistency experiments where the user is already enrolled skip the segment check entirely (must preserve this on the fast path) |
| Write path entry points | `FeatureFlagService` mutations, `SegmentService` mutations | `ExperimentService` mutations, `SegmentService` mutations |

---

## Phase 1 — New Database Table

**New file:** `packages/backend/src/database/migrations/<timestamp>-experimentPrecomputedSegment.ts`

```sql
CREATE TABLE "experiment_precomputed_segment" (
  "experimentId"  uuid    NOT NULL,
  "inclusionIds"  text[]  NOT NULL DEFAULT '{}',
  "exclusionIds"  text[]  NOT NULL DEFAULT '{}',
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "versionNumber" integer   NOT NULL DEFAULT 1,
  CONSTRAINT "PK_experiment_precomputed_segment" PRIMARY KEY ("experimentId"),
  CONSTRAINT "FK_experiment_precomputed_segment_experiment"
    FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE
)
```

`down` drops the table.

---

## Phase 2 — New Entity, Repository, Service

### Entity

**New file:** `packages/backend/src/api/models/ExperimentPrecomputedSegment.ts`

Mirrors `FeatureFlagPrecomputedSegment` exactly, with `experimentId` as the PK/FK pointing to `Experiment`.

```typescript
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

### Repository

**New file:** `packages/backend/src/api/repositories/ExperimentPrecomputedSegmentRepository.ts`

```typescript
@EntityRepository(ExperimentPrecomputedSegment)
export class ExperimentPrecomputedSegmentRepository extends Repository<ExperimentPrecomputedSegment> {
  // ON CONFLICT upsert on experimentId
  async upsertByExperimentId(experimentId: string, inclusionIds: string[], exclusionIds: string[]): Promise<void>

  // Ordered result matching input array; null for missing rows
  async findByExperimentIds(experimentIds: string[]): Promise<(ExperimentPrecomputedSegment | null)[]>
}
```

### Service

**New file:** `packages/backend/src/api/services/ExperimentPrecomputedSegmentService.ts`

All methods mirror `FeatureFlagPrecomputedSegmentService`. Key differences noted below.

#### `recomputeForExperiment(experimentId, logger)`

- Queries `ExperimentSegmentInclusionRepository.find({ where: { experiment: { id: experimentId } } })` and the same for exclusion.
- No `enabled` filter — experiments have no such field on segment join records.
- Flattens all segment members recursively via the same `flattenSegmentMembers` private helper (individuals bare, groups namespaced with `precomputedGroupKey`).
- Upserts via `ExperimentPrecomputedSegmentRepository.upsertByExperimentId`.
- Invalidates `CACHE_PREFIX.EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX + experimentId`.

#### `seedEmptyRowForExperiment(experimentId, manager)`

`orIgnore` insert for new experiments, called inside the creation transaction so the row is always atomic with the experiment row.

#### `scheduleRecomputeForExperiment(experimentIds, logger)`

Fire-and-forget recompute for a known set of experiments. Errors are swallowed and logged. The experiment-side counterpart to `scheduleRecomputeForSegment`.

#### `scheduleRecomputeForSegment(segmentId, logger)`

Fire-and-forget; calls `collectAffectedExperimentIds` then recomputes all affected experiments.

#### `collectAffectedExperimentIds(segmentId, visited)` (private)

Analogous to `collectAffectedFlagIds`. Walks `ExperimentSegmentInclusionRepository` and `ExperimentSegmentExclusionRepository` to find experiments referencing the segment directly, then recurses through parent segments via `SegmentRepository.findParentSegmentIds`.

#### `withRecompute<T>(logger, resolveAffectedExperimentIds, work)`

Identical ordering contract to the FF version:
1. Resolve affected experiment IDs **before** `work` (required for deletes).
2. Run `work` to completion (must own and commit its own transaction).
3. Fire-and-forget recompute **after** commit.

#### `getAffectedExperimentIds(segmentId)`

Public wrapper around `collectAffectedExperimentIds`; used as the `resolveAffectedExperimentIds` argument for segment deletes.

#### `getPrecomputedSets(experimentIds)`

Cache-wrapped batch fetch via `cacheService.wrapFunction(CACHE_PREFIX.EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX, ...)`. Returns `Map<string, ExperimentPrecomputedSegment>`.

#### `backfillMissingExperiments(logger)` / `recomputeAllExperiments(logger)`

Startup backfill helpers. `backfillMissingExperiments` is the safe variant — no-op for experiments that already have a row.

---

## Phase 3 — `CACHE_PREFIX` Enum Addition

**File:** `packages/types/src/Experiment/enums.ts`

Add one entry to the `CACHE_PREFIX` enum:

```typescript
EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX = 'experimentPrecomputedSegments-',
```

Rebuild `packages/types` (`npm run build`) so the backend picks up the change.

---

## Phase 4 — Write Path Hooks

### 4a. ExperimentService

**File:** `packages/backend/src/api/services/ExperimentService.ts`

Inject `ExperimentPrecomputedSegmentService`.

| Mutation | Change |
|---|---|
| Experiment creation | Inside the creation transaction, call `experimentPrecomputedSegmentService.seedEmptyRowForExperiment(newExperiment.id, manager)` before committing. |
| Add experiment segment inclusion/exclusion list | Wrap the DB mutation in `experimentPrecomputedSegmentService.withRecompute(logger, () => [experimentId], work)`. |
| Update experiment segment inclusion/exclusion list | Same — wrap in `withRecompute`. |
| Delete experiment segment inclusion/exclusion list | Capture `experimentId` before deletion, then use `withRecompute`. |

Pattern matches how `FeatureFlagService` uses `featureFlagPrecomputedSegmentService.withRecompute`.

### 4b. SegmentService

**File:** `packages/backend/src/api/services/SegmentService.ts`

Inject `ExperimentPrecomputedSegmentService` alongside the existing `FeatureFlagPrecomputedSegmentService`.

At every location where `featureFlagPrecomputedSegmentService.scheduleRecomputeForSegment` is called, also call `experimentPrecomputedSegmentService.scheduleRecomputeForSegment` with the same `segmentId` and `logger`:

- `addSegmentDataWithPipeline` — private list added to a shared segment (two call sites)
- `addSegmentDataWithPipeline` — segment members/structure updated

For `deleteSegment`, where `withRecompute` wraps the delete to capture flag IDs before deletion:
- Also call `experimentPrecomputedSegmentService.withRecompute` (or gather both flag and experiment IDs in a single pre-work step, then fire both recomputes in the post-commit callback).

---

## Phase 5 — Read Path: ExperimentAssignmentService

**File:** `packages/backend/src/api/services/ExperimentAssignmentService.ts`

Inject `ExperimentPrecomputedSegmentService`.

### New method: `experimentLevelExclusionInclusionWithPrecomputed`

Replaces direct calls to `experimentLevelExclusionInclusion` in the assign and mark paths. The existing `experimentLevelExclusionInclusion` is kept as the internal on-the-fly fallback.

```
experimentLevelExclusionInclusionWithPrecomputed(experiments, experimentUser):

1. ENROLLMENT CHECK (preserve existing getSegmentObject behavior)
   Query IndividualEnrollmentRepository for GROUP + INDIVIDUAL consistency experiments
   where the user is already enrolled.
   → These are ALWAYS included; skip the precomputed lookup for them.

2. SPLIT experiments into:
   - enrolledExperiments  → always included, no further checks needed
   - unenrolledExperiments → apply precomputed segment logic

3. FETCH PRECOMPUTED SETS
   precomputedMap = await experimentPrecomputedSegmentService.getPrecomputedSets(
     unenrolledExperiments.map(e => e.id)
   )
   On error: swallow, log, set precomputedMap = new Map() (same pattern as FF service).

4. BUILD USER GROUP KEYS
   Compose userGroupKeys from experimentUser.group using precomputedGroupKey(type, groupId).
   (Same as featureFlagLevelInclusionExclusion.)

5. SPLIT unenrolledExperiments into:
   - presentExperiments = those with a row in precomputedMap
   - missingExperiments  = those without a row (fallback)

6. ON-THE-FLY FALLBACK for missingExperiments
   Call experimentLevelExclusionInclusion (existing method) on just these experiments.
   Log a warning with the missing IDs.

7. SET-BASED EVALUATION for presentExperiments
   For each experiment:
     computed      = precomputedMap.get(exp.id)
     exclusionSet  = new Set(computed.exclusionIds)
     inclusionSet  = new Set(computed.inclusionIds)

     // Individual exclusion always wins
     if (exclusionSet.has(experimentUser.id)) → EXCLUDE

     // Individual inclusion bypasses group checks
     else if (inclusionSet.has(experimentUser.id)) → INCLUDE

     else:
       inGroupExclusion = userGroupKeys.some(k => exclusionSet.has(k))
       inGroupInclusion = userGroupKeys.some(k => inclusionSet.has(k))

       if INCLUDE_ALL:
         INCLUDE unless inGroupExclusion
         (matchedGroup set based on whether exclusion group matches exp.group)
       if EXCLUDE_ALL:
         INCLUDE only if inGroupInclusion && !inGroupExclusion

8. COMBINE RESULTS
   included = enrolledExperiments + included from steps 6 & 7
   excluded = excluded from steps 6 & 7 (with reason + matchedGroup)
   Return [includedExperiments, excludedExperiments]
```

### Call site updates

| Call site | Current call | Updated call |
|---|---|---|
| `getAllExperimentConditions` (assign, line ~381) | `this.experimentLevelExclusionInclusion(validExperiments, experimentUserDoc)` | `this.experimentLevelExclusionInclusionWithPrecomputed(validExperiments, experimentUserDoc)` |
| `markExperimentPoint` (mark, line ~232) | `this.experimentLevelExclusionInclusion(experiments, userDoc)` | `this.experimentLevelExclusionInclusionWithPrecomputed(experiments, userDoc)` |

> **Out of scope for initial implementation:** `experimentLevelExclusionInclusionForUsers` (batch assignment path). Should be addressed in a follow-up.

---

## Phase 6 — Startup Backfill

**New file:** `packages/backend/src/init/seed/backfillExperimentPrecomputedSegments.ts`

```typescript
export async function backfillExperimentPrecomputedSegments(logger: UpgradeLogger): Promise<void> {
  const service = Container.get(ExperimentPrecomputedSegmentService);
  await service.backfillMissingExperiments(logger);
}
```

**File:** `packages/backend/src/app.ts`

After the existing `backfillFeatureFlagPrecomputedSegments` call, add an equivalent best-effort call for experiments using the same error-swallowing pattern:

```typescript
return backfillExperimentPrecomputedSegments(logger).catch((err) => {
  logger.error({
    message: `experiment_precomputed_segment backfill failed at startup; continuing with on-the-fly fallback: ${err}`,
  });
});
```

---

## Phase 7 — Tests

| File | Scope |
|---|---|
| `test/unit/services/ExperimentPrecomputedSegmentService.test.ts` (new) | Mirror `FeatureFlagPrecomputedSegmentService.test.ts`; cover `recomputeForExperiment`, `backfillMissingExperiments`, cache invalidation, `withRecompute` ordering contract, `collectAffectedExperimentIds` graph traversal (direct + parent segments) |
| `test/unit/repositories/ExperimentPrecomputedSegmentRepository.test.ts` (new) | `upsertByExperimentId` conflict/upsert behavior; `findByExperimentIds` ordering and null-for-missing |
| `test/unit/services/ExperimentAssignmentService.test.ts` (update) | Add cases: precomputed cache hit (no DB segment queries); precomputed row missing → fallback to on-the-fly; enrolled experiment bypass; error-swallow fallback when `getPrecomputedSets` throws |
| `test/unit/services/SegmentService.test.ts` (update) | Assert `experimentPrecomputedSegmentService.scheduleRecomputeForSegment` is called alongside the FF recompute on all segment mutation paths |
| `test/unit/services/ExperimentService.test.ts` (update) | Assert `seedEmptyRowForExperiment` is called on experiment creation; assert `withRecompute` is called on segment list add/update/delete |

---

## Implementation Order

1. **`packages/types`** — add `CACHE_PREFIX.EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX`, rebuild
2. **Migration** — create the `experiment_precomputed_segment` table
3. **Entity** — `ExperimentPrecomputedSegment`
4. **Repository** — `ExperimentPrecomputedSegmentRepository`
5. **Service** — `ExperimentPrecomputedSegmentService` (all methods)
6. **`ExperimentService`** — seed on create; `withRecompute` on segment list mutations
7. **`SegmentService`** — add experiment recompute calls alongside existing flag recompute calls
8. **`ExperimentAssignmentService`** — add `experimentLevelExclusionInclusionWithPrecomputed`; update assign + mark call sites
9. **Backfill seed + `app.ts`** — startup wiring
10. **Tests**

---

## What Triggers a Recompute (summary)

| Event | Trigger |
|---|---|
| Experiment created | `ExperimentService` → `seedEmptyRowForExperiment` inside creation transaction |
| Segment list added to an experiment | `ExperimentService.addList` → `withRecompute` |
| Segment list updated on an experiment | `ExperimentService.updateList` → `withRecompute` |
| Segment list removed from an experiment | `ExperimentService.deleteList` → `withRecompute` (collect IDs before delete) |
| Segment members/structure changed | `SegmentService.addSegmentDataWithPipeline` → `scheduleRecomputeForSegment` |
| Segment deleted entirely | `SegmentService.deleteSegment` → `withRecompute` (collect IDs before delete) |
| Server startup | `app.ts` → `backfillMissingExperiments` — backfills any experiment with no row |

All recomputes on write paths are **fire-and-forget** — no request handler ever blocks on a recompute.

---

## Key Invariants

- The `experiment_precomputed_segment` row must always be recomputed **after** the structural change commits so the flat arrays reflect the new state.
- For deletions, affected experiment IDs must be collected **before** the delete because the join records are gone afterward. Both halves of this invariant are enforced by `withRecompute`.
- The enrolled-experiment bypass (GROUP + INDIVIDUAL consistency, user already enrolled) must happen **before** the precomputed lookup, not after, to match the semantics of the existing `getSegmentObject` logic.
- Individuals are stored bare in the flat arrays; groups are namespaced with their type using `precomputedGroupKey(type, groupId)` from `FeatureFlagPrecomputedSegmentService` — import and reuse this helper rather than duplicating it.
