# Plan: Precomputed Segment Lists for Experiments

Port the feature-flag precomputed segment list pattern to experiments.
The feature-flag implementation is complete and stable on `wip/segments-precalculated` — this is a 1:1 parallel.

## Background

Experiments currently resolve segment inclusion/exclusion **on-the-fly at assignment time** via recursive `resolveSegment()` calls in `ExperimentAssignmentService`. This is the same slow path that feature flags moved away from. The goal is to precompute flat `inclusionIds[]` / `exclusionIds[]` arrays per experiment, stored in a new `precomputed_experiment_segment` table, so the assignment path becomes a fast in-memory `Set.has()` check.

Key difference from feature flags: experiment join tables (`ExperimentSegmentInclusion`, `ExperimentSegmentExclusion`) have **no `enabled` column** — all rows are active. The `where: { enabled: true }` filter in `recomputeForFlag` does not apply here.

## Files to create

- `src/api/models/PrecomputedExperimentSegment.ts` — entity
- `src/api/repositories/PrecomputedExperimentSegmentRepository.ts` — repo
- `src/database/migrations/<timestamp>-precomputedExperimentSegment.ts` — migration
- `src/init/seed/backfillPrecomputedExperimentSegments.ts` — startup backfill

## Files to modify

- `src/api/services/PrecomputedSegmentService.ts` — add experiment methods
- `src/api/services/ExperimentAssignmentService.ts` — replace `resolveSegment()` with precomputed lookup
- `src/api/services/ExperimentService.ts` — add recompute triggers on segment list mutations
- `src/app.ts` — wire startup backfill

---

## Step 1 — Entity

**`src/api/models/PrecomputedExperimentSegment.ts`**

Mirror `PrecomputedSegment` exactly, replacing the feature flag FK with an experiment FK:

```ts
@Entity()
export class PrecomputedExperimentSegment extends BaseModel {
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

Register the entity in `env.ts` (wherever the entities glob is — confirm it picks up `src/api/models/*.ts` automatically; if so no change needed).

---

## Step 2 — Repository

**`src/api/repositories/PrecomputedExperimentSegmentRepository.ts`**

Mirror `PrecomputedSegmentRepository`:

```ts
@EntityRepository(PrecomputedExperimentSegment)
export class PrecomputedExperimentSegmentRepository extends Repository<PrecomputedExperimentSegment> {
  public async upsertByExperimentId(experimentId: string, inclusionIds: string[], exclusionIds: string[]): Promise<void> {
    await this.createQueryBuilder()
      .insert()
      .into(PrecomputedExperimentSegment)
      .values({ experimentId, inclusionIds, exclusionIds })
      .orUpdate(['inclusionIds', 'exclusionIds', 'updatedAt'], ['experimentId'])
      .execute();
  }

  public async findByExperimentIds(experimentIds: string[]): Promise<(PrecomputedExperimentSegment | null)[]> {
    if (!experimentIds.length) return [];
    const rows = await this.createQueryBuilder('ps')
      .where('ps.experimentId IN (:...ids)', { ids: experimentIds })
      .getMany();
    return experimentIds.map((id) => rows.find((r) => r.experimentId === id) ?? null);
  }
}
```

---

## Step 3 — Migration

Generate via:
```bash
npm run migration:generate -- -n precomputedExperimentSegment
```

Expected output — creates `precomputed_experiment_segment` table with `experimentId` PK (uuid), `inclusionIds` text[], `exclusionIds` text[], standard `BaseModel` timestamp columns, FK to `experiment` with `ON DELETE CASCADE`.

Verify the generated migration matches intent before running.

---

## Step 4 — Service methods

**`src/api/services/PrecomputedSegmentService.ts`** — inject `PrecomputedExperimentSegmentRepository` and `ExperimentSegmentInclusionRepository` / `ExperimentSegmentExclusionRepository` and `ExperimentRepository`, then add:

```ts
public async recomputeForExperiment(experimentId: string, logger: UpgradeLogger): Promise<void> {
  const [inclusionRecords, exclusionRecords] = await Promise.all([
    this.experimentSegmentInclusionRepository.find({
      where: { experiment: { id: experimentId } },
      relations: ['segment'],
    }),
    this.experimentSegmentExclusionRepository.find({
      where: { experiment: { id: experimentId } },
      relations: ['segment'],
    }),
  ]);

  const inclusionSegmentIds = inclusionRecords.map((r) => r.segment.id);
  const exclusionSegmentIds = exclusionRecords.map((r) => r.segment.id);

  const [inclusionIds, exclusionIds] = await Promise.all([
    this.flattenSegmentMembers(inclusionSegmentIds, new Set()),
    this.flattenSegmentMembers(exclusionSegmentIds, new Set()),
  ]);

  await this.precomputedExperimentSegmentRepository.upsertByExperimentId(
    experimentId,
    [...new Set(inclusionIds)],
    [...new Set(exclusionIds)]
  );

  await this.cacheService.delCache(CACHE_PREFIX.PRECOMPUTED_EXPERIMENT_SEGMENT_KEY_PREFIX + experimentId);
  logger.info({ message: `Recomputed precomputed_experiment_segment for experiment ${experimentId}` });
}

public scheduleRecomputeForExperimentSegment(segmentId: string, logger: UpgradeLogger): void {
  this.collectAffectedExperimentIds(segmentId, new Set())
    .then((experimentIds) => Promise.all([...experimentIds].map((id) => this.recomputeForExperiment(id, logger))))
    .catch((err) => logger.error({ message: `Error in scheduleRecomputeForExperimentSegment: ${err}` }));
}

public async getAffectedExperimentIds(segmentId: string): Promise<string[]> {
  return [...(await this.collectAffectedExperimentIds(segmentId, new Set()))];
}

public async getExperimentPrecomputedSets(experimentIds: string[]): Promise<Map<string, PrecomputedExperimentSegment>> {
  if (!experimentIds.length) return new Map();
  const results = await this.cacheService.wrapFunction(
    CACHE_PREFIX.PRECOMPUTED_EXPERIMENT_SEGMENT_KEY_PREFIX,
    experimentIds,
    () => this.precomputedExperimentSegmentRepository.findByExperimentIds(experimentIds)
  );
  const map = new Map<string, PrecomputedExperimentSegment>();
  experimentIds.forEach((id, i) => {
    if (results[i]) map.set(id, results[i] as PrecomputedExperimentSegment);
  });
  return map;
}

public async backfillMissingExperiments(logger: UpgradeLogger): Promise<void> {
  const [allExperiments, existingRows] = await Promise.all([
    this.experimentRepository.find({ select: ['id'] }),
    this.precomputedExperimentSegmentRepository.find({ select: ['experimentId'] }),
  ]);
  const existingIds = new Set(existingRows.map((r) => r.experimentId));
  const missing = allExperiments.filter((e) => !existingIds.has(e.id));
  if (!missing.length) {
    logger.info({ message: 'precomputed_experiment_segment backfill: all experiments already have rows, nothing to do' });
    return;
  }
  for (const exp of missing) {
    try {
      await this.recomputeForExperiment(exp.id, logger);
    } catch (err) {
      logger.error({ message: `Failed to backfill precomputed_experiment_segment for experiment ${exp.id}: ${err}` });
    }
  }
  logger.info({ message: `precomputed_experiment_segment backfill complete: computed ${missing.length} of ${allExperiments.length} experiments` });
}

private async collectAffectedExperimentIds(segmentId: string, visited: Set<string>): Promise<Set<string>> {
  if (visited.has(segmentId)) return new Set();
  visited.add(segmentId);

  const [inclusionRecords, exclusionRecords] = await Promise.all([
    this.experimentSegmentInclusionRepository.find({
      where: { segment: { id: segmentId } },
      relations: ['experiment'],
    }),
    this.experimentSegmentExclusionRepository.find({
      where: { segment: { id: segmentId } },
      relations: ['experiment'],
    }),
  ]);

  const experimentIds = new Set([
    ...inclusionRecords.map((r) => r.experiment.id),
    ...exclusionRecords.map((r) => r.experiment.id),
  ]);

  const parentIds = await this.segmentRepository.findParentSegmentIds(segmentId);
  await Promise.all(
    parentIds.map(async (parentId) => {
      const parentExpIds = await this.collectAffectedExperimentIds(parentId, visited);
      parentExpIds.forEach((id) => experimentIds.add(id));
    })
  );

  return experimentIds;
}
```

Note: `flattenSegmentMembers` is shared — no duplication needed. Only the join table queries and repository differ.

**Add `PRECOMPUTED_EXPERIMENT_SEGMENT_KEY_PREFIX` to `CACHE_PREFIX` in `packages/types`.**

---

## Step 5 — ExperimentAssignmentService read path

This is the largest change. Currently `getIncludedAndExcludedExperiments()` → `resolveSegmentsForEntities()` → `resolveSegment()` do recursive DB queries. Replace that with a precomputed lookup.

The pattern to follow is `FeatureFlagService.featureFlagLevelInclusionExclusion()` — call `getExperimentPrecomputedSets(experimentIds)` and replace the `includeData` / `excludeData` maps that `inclusionExclusionLogic()` currently receives from recursive resolution with maps built from the precomputed flat arrays.

Specific methods to audit and update in `ExperimentAssignmentService.ts`:
- `getSegmentObject()` (line ~2102) — currently extracts segment IDs to resolve
- `resolveSegmentsForEntities()` (line ~2140) — drives resolution; replace with precomputed map build
- `getIncludedAndExcludedExperiments()` (line ~2156) — wires the above together
- `inclusionExclusionLogic()` (line ~2231) — the actual include/exclude evaluation; this should be largely untouched if the input maps have the same shape

The key question to verify before implementing: does `inclusionExclusionLogic()` expect `{users: userId[], groups: {type, groupId}[]}` shaped data from resolved segments, or does it work with flat ID arrays? Flat inclusion/exclusion arrays may need a small shim to match the expected shape. Inspect the method signature and callers carefully before changing the data shape.

---

## Step 6 — ExperimentService triggers

Find the equivalents of the three `FeatureFlagService` trigger points and add matching calls. Look for methods that:
- Add a segment to an experiment's inclusion/exclusion list → `recomputeForExperiment` after
- Remove a segment from an experiment's inclusion/exclusion list → `recomputeForExperiment` after
- Update segment members in an experiment context → `recomputeForExperiment` after
- Delete an experiment's segment entirely → collect IDs before, recompute after (same pattern as `SegmentService.deleteSegment`)

Also check if `ExperimentService` has a `deleteExperiment` path — if so, the FK cascade handles cleanup (same as feature flags), no extra work needed.

The `SegmentService` triggers (`scheduleRecomputeForExperimentSegment`) should be added alongside the existing `scheduleRecomputeForSegment` calls at lines 440, 468, and 1027 — both feature flags and experiments need recomputing when shared segment members change.

---

## Step 7 — Startup backfill

**`src/init/seed/backfillPrecomputedExperimentSegments.ts`**:

```ts
import { PrecomputedSegmentService } from '../../api/services/PrecomputedSegmentService';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import Container from 'typedi';

export async function backfillPrecomputedExperimentSegments(logger: UpgradeLogger): Promise<void> {
  const precomputedSegmentService = Container.get<PrecomputedSegmentService>(PrecomputedSegmentService);
  await precomputedSegmentService.backfillMissingExperiments(logger);
}
```

**`src/app.ts`** — add after the existing `backfillPrecomputedSegments` call:

```ts
.then(() => {
  return backfillPrecomputedExperimentSegments(logger);
});
```

---

## Step 8 — Update CLAUDE.md

Add a matching section to `packages/backend/CLAUDE.md` documenting the experiment precomputed segment pattern (mirror the feature flag section already there).

---

## Checklist

- [ ] Step 1: `PrecomputedExperimentSegment` entity
- [ ] Step 2: `PrecomputedExperimentSegmentRepository`
- [ ] Step 3: Migration generated and verified
- [ ] Step 4: `PrecomputedSegmentService` experiment methods + `CACHE_PREFIX` constant
- [ ] Step 5: `ExperimentAssignmentService` read path refactored
- [ ] Step 6: `ExperimentService` write triggers added
- [ ] Step 6b: `SegmentService` triggers extended for experiments (lines 440, 468, 1027)
- [ ] Step 7: Startup backfill wired into `app.ts`
- [ ] Step 8: CLAUDE.md updated
- [ ] Typecheck passes
- [ ] Migration runs cleanly
- [ ] Manual smoke test: pre-existing experiment with segment lists shows correct assignment after restart
