# Quicktest

Manual testing harness for the UpGrade JavaScript client library. Not an automated test suite — this is a developer tool for ad-hoc testing and debugging against running environments.

There are two entry points:

- **`quicktest`** — runs a single `.quicktest` config file once
- **`looper`** — runs an ordered sequence of quicktest configs (defined in a `.looper.ts` file), with optional repetition, and produces a single combined log

## Running

From `clientlibs/js/`:

```bash
yarn quicktest                           # default-local config, 1 run
yarn quicktest --config qa               # use tests/qa.quicktest
yarn quicktest --setup                   # create experiment, then run
yarn quicktest --teardown                # delete experiment from config
yarn quicktest --wizard                  # interactive config generator
yarn quicktest --build                   # force rebuild of dist/node first

yarn looper --looper my-sequence         # run tests/my-sequence.looper.ts
yarn looper --looper my-sequence --build # force rebuild first
```

From the repo root:

```bash
yarn quicktest default-local             # appends to the --config flag
yarn looper my-sequence                  # appends to the --looper flag
```

## Quicktest Config System

Each quicktest run loads a `.quicktest` file from `tests/`. The file contains `KEY=VALUE` environment pairs parsed via `dotenv` into a `cfg` object (does **not** pollute `process.env`).

- Default: `tests/default-local.quicktest` (committed — works against `localhost:3030`)
- Override with `--config <name>` → loads `tests/<name>.quicktest`
- All user-generated configs are gitignored
- Generate a new config interactively with `--wizard`

Key config fields:

| Key | Purpose |
|-----|---------|
| `HOST_URL` | Server to test against |
| `ADMIN_API_TOKEN` | Bearer token for `--setup` / `--teardown` |
| `CONTEXT` | App context |
| `SITE` / `TARGET` | Decision point |
| `EXPERIMENT_ID` | Experiment to run against |
| `CONDITIONS` | Experiment conditions |
| `USER_ID_MODE` | `SPECIFIED_USER_SAME_ALL_LOOPS`, `RANDOM_SAME_FOR_ALL_LOOPS`, or `RANDOM_EVERY_SESSION_LOOP` |
| `USER_GROUPS` | `groupType:id1,id2;groupType2:id3` format |
| `WORKING_GROUP_TYPE` / `WORKING_GROUP_ID` | Active working group |
| `SCRIPT` | Comma-separated list of functions to run each session |

## Looper System

A `.looper.ts` file in `tests/` defines a sequence of quicktest configs (and/or nested loopers) to run in order. All output is written to a single combined log.

```typescript
// tests/my-sequence.looper.ts
import type { LooperConfig } from '../looper';

export default {
  runs: 3,                                    // optional — repeat the full sequence N times (default 1)
  sequence: ['local-failure', 'local-success'], // .quicktest or .looper.ts names (no extension)
} satisfies LooperConfig;
```

- Looper files are gitignored
- Nested loopers are expanded inline with their own `runs` multiplier
- Each step runs as an isolated subprocess; a non-zero exit is noted but does not abort the run
- The combined log lands in `runlogs/<timestamp>_<loopername>.log`

## Global Defaults (`runner.config.ts`)

`runner.config.ts` exports `QUICKTEST_DEFAULTS` — the only values here are:

- `defaultContext`: Context pre-selected in the wizard
- `hostUrls`: Server URL choices shown in the wizard (first entry is default)

## Script Functions

Functions available to include in `SCRIPT`:

- `doInit` — initialize user with groups/working groups
- `doGroupMembership` — set group membership
- `doWorkingGroupMembership` — set active working group
- `doAliases` — set alternative user IDs
- `doAssign` — get all experiment conditions (cached)
- `doAssignIgnoreCache` — get all experiment conditions (bypass cache)
- `doGetDecisionPointAssignment` — get assignment for configured site/target
- `doMark` — mark decision point as encountered
- `doLog` — send sample metrics
- `doSendRewardByExperimentId` — send reward by experiment ID
- `doSendRewardByDecisionPoint` — send reward by decision point
- `doFeatureFlags` — get all feature flags for user (cached)
- `doFeatureFlagsIgnoreCache` — get all feature flags (bypass cache)
- `doHasFeatureFlag` — check if `FEATURE_FLAG_KEY` is enabled for user
- `doSetFeatureFlagUserGroupsForSession` — set feature flag user groups on the client instance

## Wizard

`wizard.ts` provides a multi-step interactive flow that:
1. Fetches available contexts and experiments from the server
2. Guides user group/working group setup
3. Shows a keyboard-navigable grid to pick and order script functions
4. Optionally generates a new test experiment
5. Writes the resulting `.quicktest` file

The script picker uses raw stdin mode (`process.stdin.setRawMode(true)`) for arrow key navigation.

## Key Files

- `quickTest.ts` — single-run CLI entry point, `runOnce`, setup/teardown
- `looper.ts` — looper runner; exports `LooperConfig` type for use in `.looper.ts` files
- `run.ts` — build-check wrapper for `quickTest.ts`
- `run-looper.ts` — build-check wrapper for `looper.ts`
- `wizard.ts` — interactive config generator
- `runner.config.ts` — global defaults (wizard host URLs and default context)
- `tests/default-local.quicktest` — committed template for local dev

## Important Notes

- If `dist/node` does not exist, the build runs automatically. Pass `--build` to force a rebuild.
- `--setup` and `--teardown` require `ADMIN_API_TOKEN` in the config file
- `run.ts` / `run-looper.ts` are thin build-check wrappers — necessary because `quickTest.ts` has a static import of `../dist/node` that Node resolves before any code runs
- `ts-node` executes all scripts directly; there is no separate compile step
