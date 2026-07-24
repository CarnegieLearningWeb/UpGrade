# Backend Package

## Stack

Express + `routing-controllers` + `TypeDI` — **NOT NestJS**. Despite `@nestjs/common` appearing in some imports, there are no NestJS modules and no NestJS DI bootstrap. The app initializes via `microframework` loaders (`winstonLoader` → `iocLoader` → `typeormLoader` → `expressLoader` → `swaggerLoader`).

## Commands (NPS — use `npm start`, not `npm run`)

```bash
npm start serve                   # dev server with nodemon (watch mode)
npm start serve.inspector         # dev server + Node inspector (debug)
npm start build                   # compile TypeScript to dist/
npm start test.unit.run           # unit tests
npm start test.integration.run    # integration tests
npm start test.coverage           # full test suite with coverage
npm start db.seed                 # seed database
npm start db.drop                 # drop database

# Migrations (these use npm run, not npm start)
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert
```

## Architecture Layers

Data flows strictly in one direction:

```
models/ → repositories/ → services/ → controllers/
```

- **models/** — TypeORM `@Entity()` classes. No business logic here.
- **repositories/** — Own ALL query-building. Use `createQueryBuilder` here. Services never build queries directly.
- **services/** — Business logic. Decorated with `@Service()` from `typedi`.
- **controllers/** — HTTP layer. Use `@JsonController()` from `routing-controllers`. Always add `@Authorized()` unless the route is intentionally public.
- **DTO/** — Request validation classes using `class-validator` decorators.

## Dependency Injection

The DI decorators are **local copies** in `src/typeorm-typedi-extensions/` — do NOT import from `typeorm` or `@nestjs/*`:

```ts
// Correct
import { InjectRepository } from '../typeorm-typedi-extensions/decorators/InjectRepository';
import { InjectDataSource } from '../typeorm-typedi-extensions/decorators/InjectDataSource';
```

Services are injected via `@Inject()` from `typedi`.

## Database Migrations

Any change to an `@Entity` model **requires a new TypeORM migration**. Never set `TYPEORM_SYNCHRONIZE=true` in production.

```bash
npm run migration:generate -- -n DescriptiveMigrationName
npm run migration:run
```

## Auth

- Google OAuth token validation via `authorizationChecker` in `src/auth/`
- `@Authorized()` decorator (from routing-controllers) enforces auth on controllers
- `@CurrentUser()` injects the authenticated `User` object into handler params

## Environment

Copy `.env.example` to `.env` for local dev. Never commit `.env` files. Key sections: `app`, `db`, `google`, `swagger`, `aws`. See `src/env.ts` for the full typed schema.

## Swagger

Available at `/swagger` when `SWAGGER_ENABLED=true`. Auto-generated from JSDoc `@swagger` annotations in controllers.

## Test Coverage Target

~49% current, 80% goal. Tests live in `test/` (not alongside source files).

## Precomputed Segment Lists (Feature Flags)

Segment inclusion/exclusion for **feature flags** is precomputed and stored flat in the `feature_flag_precomputed_segment` table rather than resolved on-the-fly at assignment time.

### How it works

- **`FeatureFlagPrecomputedSegment` entity** (`src/api/models/FeatureFlagPrecomputedSegment.ts`) — one row per feature flag, columns: `featureFlagId` (PK), `inclusionIds: text[]`, `exclusionIds: text[]`. FK to `feature_flag` with `onDelete: CASCADE`.
- **`FeatureFlagPrecomputedSegmentService`** (`src/api/services/FeatureFlagPrecomputedSegmentService.ts`) — owns all computation and cache logic:
  - `recomputeForFlag(flagId)` — flattens all enabled inclusion/exclusion segments (recursive sub-segments) into flat ID arrays and upserts the row. This is the only method that `await`s — callers on write paths never call it directly.
  - `scheduleRecomputeForFlags(flagIds[])` — fire-and-forget recompute for a known set of flags (swallows/logs errors). The flag-side counterpart to `scheduleRecomputeForSegment`.
  - `scheduleRecomputeForSegment(segmentId)` — fire-and-forget; finds all flags referencing a segment (and its parents) and recomputes each.
  - `withRecompute(logger, resolveAffectedFlagIds, work)` — **the wrapper all top-level write methods use.** Resolves affected flag IDs *before* `work`, runs `work` (which must own/commit its own transaction), then fires a fire-and-forget recompute *after* commit. Keeps mutation + recompute in one call so a refactor can't drop the recompute. `work` is never blocked on the recompute.
  - `getAffectedFlagIds(segmentId)` — public helper that returns flag IDs affected by a given segment (used as the `resolveAffectedFlagIds` for segment deletes).
  - `getPrecomputedSets(flagIds[])` — cache-wrapped batch fetch, returns a `Map<flagId, FeatureFlagPrecomputedSegment>`.
  - `backfillMissingFlags(logger)` — called at startup; computes rows only for flags that have none yet (no-op once all flags are populated).
  - `recomputeAllFlags(logger)` — full refresh of every flag; not called automatically, available for manual recovery.
- **Assignment read path** — `FeatureFlagService.featureFlagLevelInclusionExclusion()` calls `getPrecomputedSets()` and does in-memory `Set.has()` checks. No recursive segment queries at assignment time.
- **Cache** — keyed by `CACHE_PREFIX.PRECOMPUTED_SEGMENT_KEY_PREFIX + flagId`. Invalidated by `recomputeForFlag`.

### What triggers a recompute

| Event | Trigger |
|---|---|
| Segment list added to a flag | `FeatureFlagService.addList` → `withRecompute` |
| Segment list removed from a flag | `FeatureFlagService.deleteList` → delegates to `SegmentService.deleteSegment` (which owns the recompute) |
| Segment list members updated on a flag | `FeatureFlagService.updateList` → `withRecompute` |
| Flag context changed (deletes all its lists) | `FeatureFlagService.updateFeatureFlagInDB` → `withRecompute` (recomputes to empty; the segment delete does **not** cascade to the precomputed row) |
| Private list added to a shared segment | `SegmentService.addList` → `scheduleRecomputeForSegment` |
| Private list removed from a shared segment | `SegmentService.deleteList` → `scheduleRecomputeForSegment` |
| Segment members/structure updated | `SegmentService.addSegmentDataWithPipeline` → `scheduleRecomputeForSegment` |
| Segment deleted entirely | `SegmentService.deleteSegment` → `withRecompute` (collects affected flag IDs **before** the delete, recomputes **after** commit) |
| Server startup | `app.ts` → `backfillMissingFlags` — backfills any flag with no row |

All recomputes triggered from write paths are **fire-and-forget** — no request handler (flag-side or segment-side) ever blocks on a recompute. The `import*` paths are the one exception: they `await recomputeForFlag` so "import complete" means the rows are ready.

### Key invariant

The `feature_flag_precomputed_segment` row must always be recomputed **after** the structural change commits, so the flat arrays reflect the new state. For deletions specifically, affected flag IDs must be collected **before** the delete because the join table records are gone afterward. Both halves of this invariant are enforced by `withRecompute` (resolve-before → work → recompute-after), so top-level write methods get the ordering for free rather than hand-rolling it.

## Precomputed Segment Lists (Experiments)

Experiments use the **same mechanism** as feature flags, stored in the `experiment_precomputed_segment` table (`experimentId` PK + `inclusionIds`/`exclusionIds` text arrays, FK to `experiment` `ON DELETE CASCADE`). This replaced the old on-the-fly recursive `resolveSegment()` resolution at assignment time.

### Shared engine

The domain-agnostic logic lives in **`PrecomputedSegmentServiceBase`** (`src/api/services/PrecomputedSegmentServiceBase.ts`), which both `FeatureFlagPrecomputedSegmentService` and **`ExperimentPrecomputedSegmentService`** extend. The base owns `recomputeOwner`, `scheduleRecomputeForSegment`, `scheduleRecomputeForOwners`, `withRecompute`, `getPrecomputedSets`, `backfillMissingOwners`, `recomputeAllOwners`, and the affected-owner ancestor walk. Subclasses supply the seams: which join repositories, the precomputed repository, the cache prefix, and (crucially) how to fetch an owner's segment IDs. Pure helpers (`flattenSegmentMembers`, `precomputedGroupKey`, `PRECOMPUTED_GROUP_DELIMITER`) live in `src/api/services/precomputedSegmentHelpers.ts` and are shared by both write paths and both read paths.

`ExperimentPrecomputedSegmentService` exposes domain-named wrappers: `recomputeForExperiment`, `scheduleRecomputeForExperiments`, `getAffectedExperimentIds`, `backfillMissingExperiments`, `recomputeAllExperiments`, `seedEmptyRowForExperiment`, plus the inherited `scheduleRecomputeForSegment` / `withRecompute` / `getPrecomputedSets`.

### Key difference from feature flags

Experiment join tables (`ExperimentSegmentInclusion` / `ExperimentSegmentExclusion`) have **no `enabled` column** — every row is active. So `getListsForOwner` on the experiment subclass does **not** apply the `enabled: true` filter the flag subclass uses, and there is **no** experiment analog of `updateListStatus` (the flag enabled-toggle trigger).

### Assignment read path

`ExperimentAssignmentService.experimentLevelExclusionInclusion(...)` (and its multi-user sibling) call `getPrecomputedSets(experimentIds)` and build the `{ users, groups }`-shaped `includeData`/`excludeData` for the current user via `buildExperimentIncludeExcludeData` (individuals matched bare against `experimentUser.id`, groups matched via `precomputedGroupKey`). That data is fed into the **unchanged** `inclusionExclusionLogic`, so the include/exclude semantics (and the `reason`/`matchedGroup` exclusion details) are identical to before — only the data source changed. A read failure, or any experiment missing a precomputed row, falls back to on-the-fly recursive `resolveSegment` resolution (`fetchExperimentPrecomputedWithFallback`), mirroring the flag read path.

### What triggers a recompute

| Event | Trigger |
|---|---|
| Segment list added to an experiment | `ExperimentService.addList` → `withRecompute` (self-owned-transaction branch only) |
| Segment list members updated | `ExperimentService.updateList` → `withRecompute` (passes `skipScheduleRecompute=true` to the segment upsert) |
| Segment list removed | `ExperimentService.deleteList` → delegates to `SegmentService.deleteSegment` (which owns the recompute) |
| Experiment created | `ExperimentService.create` → `await recomputeForExperiment` after lists attach (only when it owns the commit; recompute yields empty arrays for list-less experiments, so no separate empty-seed) |
| Experiment created inside a Mooclet transaction | `MoocletExperimentService.syncCreate` → `await recomputeForExperiment` after the transaction commits (create deferred it because it ran inside the transaction) |
| Experiment lists imported | `ExperimentService.importExperimentLists` → `await recomputeForExperiment` after the import transaction commits |
| Experiment context changed (deletes all its lists) | `ExperimentService.updateExperimentInDB` → `scheduleRecomputeForExperiments` after commit (recomputes to empty; `deleteAllListsFromExperiment` deletes the private segments directly, so the precomputed row would otherwise keep stale IDs). When a caller owns the transaction (`MoocletExperimentService.syncUpdate` / `syncUpdateWithMoocletAlgorithmTransition`), those methods recompute after their own commit — mirrors the flag side's `updateFeatureFlagInDB` → `withRecompute` |
| Shared segment members/structure changed | `SegmentService.addList` / `deleteList` / `addSegmentDataWithPipeline` → `scheduleRecomputeForSegment` for **both** the flag and experiment services |
| Segment deleted entirely | `SegmentService.deleteSegment` → collects affected experiment IDs **before** the delete, recomputes **after** commit (flags use `withRecompute` in the same method) |
| Server startup | `app.ts` → `backfillExperimentPrecomputedSegments` (guarded by `.catch` — a missing table never crashes startup) |

Same invariant as feature flags: recompute **after** the change commits; for deletes, collect affected experiment IDs **before**. All write-path recomputes are fire-and-forget except the `create` / import / Mooclet paths, which `await` so "done" means the row is ready.

### INCLUDE_ALL semantics (resolved)

`INCLUDE_ALL` is **not** an explicit inclusion, so **include lists are ignored entirely** for an `INCLUDE_ALL` flag or experiment — neither individual nor group inclusion is consulted. The only way a user is removed from an `INCLUDE_ALL` entity is via **exclusion**: the user is excluded if they are individually on the exclude list, or if any of their groups is on the exclude list. In particular, an individually "included" user whose group is on the exclude list is still **excluded** — individual inclusion never overrides a group exclusion here. (`EXCLUDE_ALL` is unchanged: individual inclusion is explicit and bypasses group checks.)

This is enforced consistently across all read paths:
- `ExperimentAssignmentService.inclusionExclusionLogic` — the `INCLUDE_ALL` branch checks individual exclusion, then group exclusion, then includes; it never reads either inclusion list. Shared by both experiment read paths and the flag on-the-fly fallback.
- `FeatureFlagService.featureFlagLevelInclusionExclusion` — the precomputed read path returns `!inGroupExclusion` for `INCLUDE_ALL` and only consults inclusion in the `EXCLUDE_ALL` branch.

The precomputed rows still store the full inclusion arrays regardless of `filterMode` (the read paths simply ignore them for `INCLUDE_ALL`), so no `filterMode`-change recompute is required for correctness. Trimming the unread inclusion members from `INCLUDE_ALL` rows remains an available storage/cache optimization (the deferred Phase 0.5 in `.claude/plans/precomputed-segments-experiments.md`), not a correctness concern.
