# Types Package

## Purpose

Shared TypeScript types consumed by `packages/backend`, `packages/frontend`, and `clientlibs/js`. Changes here affect all three simultaneously.

## Import Pattern

All consumers import using the `upgrade_types` alias — never relative paths:

```ts
import { EXPERIMENT_STATE, IFeatureFlag, FEATURE_FLAG_STATUS } from 'upgrade_types';
```

## Structure

```
src/
  Experiment/
    enums.ts       # all enums + display map constants
    interfaces.ts  # all interfaces
  Mooclet/         # Mooclet-specific types and policy schemas
  index.ts         # single re-export point for everything
```

Add new types to the appropriate domain file and export from `src/index.ts`.

## Enum Convention

If an enum will be displayed in the UI, add a corresponding `_DISPLAY_MAP` constant in the same file:

```ts
export enum CONSISTENCY_RULE { ... }
export const CONSISTENCY_RULE_DISPLAY_MAP: Record<CONSISTENCY_RULE, string> = { ... };
```

See existing display maps (`ASSIGNMENT_UNIT_DISPLAY_MAP`, `CONDITION_ORDER_DISPLAY_MAP`, etc.) for the pattern.

## Build

```bash
npm run build         # compile to dist/ (required for consumers to pick up local changes)
npm run build:watch   # watch mode
```

After editing this package, rebuild and run `npm run typecheck` in `packages/backend` and `packages/frontend` to catch breakage before committing.

## No Tests

This package has no test suite. Type correctness is validated by consumer typechecks.
