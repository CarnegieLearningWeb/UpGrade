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
