# JavaScript Client Library

## Purpose

TypeScript SDK for the UpGrade API. Distributed as three build targets for different consumer environments.

## Build Targets

All three are produced by a single `npm run build`:

| Target | Output | HTTP client | Use case |
|--------|--------|-------------|----------|
| Browser | `dist/browser/` | axios bundled | Web apps |
| Node | `dist/node/` | axios bundled | Node.js servers |
| Lite | `dist/lite/` | **none — must provide your own** | Minimal bundle size |

The lite variant is controlled by the `USE_CUSTOM_HTTP_CLIENT` webpack flag. If a consumer uses the lite build without passing a custom `httpClient` to the `UpgradeClient` constructor, it throws at runtime.

Custom HTTP clients must implement `IHttpClientWrapper`.

## Commands

```bash
npm run build           # full build: clean → webpack → type declarations → version sync → prepare packages
npm run clean           # remove dist/
npm run test            # Jest
npm run test:coverage   # Jest with coverage
npm run quicktest       # runs quickTest.ts — manual scratchpad only, not part of the test suite
npm run lint            # ESLint + Prettier check
npm run lint:fix        # ESLint fix + Prettier write
```

Run `npm run build` as a unit — do not invoke the sub-steps (webpack, build:types, version:sync, prepare:packages) individually in normal workflows.

## API Version

`API_VERSION` is injected at build time via webpack `DefinePlugin`. Do not hardcode version numbers in source files — reference the global `API_VERSION`.

## Tests

Jest config (`jest.config.ts`) sets `USE_CUSTOM_HTTP_CLIENT: true` globally, meaning tests always run against the custom-HTTP-client code path (lite variant behavior). Account for this when writing or reading tests.

## Publishing

Automated via `.github/workflows/clientlibs-js-publish.yml` on push to `main` when `clientlibs/js/**` files change. Do not publish manually to npm.

## Public API (UpgradeClient)

Main class exported as default. Key methods:

- `init(group?, workingGroup?)` — initialize user session
- `getAllExperimentConditions(options?)` — fetch all experiment assignments (cached)
- `getDecisionPointAssignment(site, target?)` — get assignment for a specific decision point
- `markDecisionPoint(site, target, condition?, status, ...)` — record that a user saw a condition
- `getAllFeatureFlags(options?)` — fetch feature flags for user (cached)
- `hasFeatureFlag(key)` — check if a feature flag is enabled
- `log(value)` / `logCaliper(value)` — report outcome metrics
- `setGroupMembership(group)` / `setWorkingGroup(workingGroup)` — update group metadata
- `sendReward(params)` — send binary reward for adaptive experiments
