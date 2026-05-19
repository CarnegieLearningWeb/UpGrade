# Frontend Package

## Stack

Angular 20+ with ngrx state management, Angular Material, and SCSS theming. Not using Angular Signals yet — all state flows through ngrx.

## Commands

```bash
npm run start           # dev server at localhost:4200
npm run docker:local    # dev server bound to 0.0.0.0 (for Docker)
npm run build:prod      # production build
npm run test            # Jest in watch mode
npm run test:once       # Jest single run (CI)
npm run typecheck       # tsc type check (no emit)
npm run lint            # ESLint + Prettier check
npm run lint:fix        # ESLint fix + Prettier write
npm run analyze         # webpack-bundle-analyzer
```

## NgRx Conventions

Each feature has a `store/` directory with exactly these files:

```
store/
  actions.ts     # all actions for the feature
  effects.ts     # async side effects (API calls)
  reducer.ts     # state transitions using entity adapter
  selectors.ts   # memoized selectors
  model.ts       # TS interfaces for the feature's state shape
```

See `src/app/core/feature-flags/store/` as the canonical reference.

**State registration lives in CoreModule**, not in feature routing modules. When adding a new feature store, register its `StoreModule.forFeature()` and `EffectsModule.forFeature()` in `CoreModule`.

## Shared Components

Before creating a new shared component, check `shared-standalone-component-lib/components/` — it has 27 standalone components covering common page layouts, modals, section cards, tables, tags, status indicators, and more. Use these first.

New shared components belong in `shared-standalone-component-lib/` as standalone components (not in NgModules).

## Change Detection

All new components default to `OnPush` (configured in `angular.json` schematic defaults). Do not change to `Default` without a concrete reason.

## Theming

Angular Material theming via SCSS:
- Global theme: `src/themes/light-theme.scss`
- Component-level theming: `*.theme.scss` files using Material mixins
- Variables: `src/styles/variables.scss`
- Density modifiers: `.dense-1`, `.dense-2` classes

Do not hardcode colors in component SCSS — use theme variables and Material mixins.

## Path Aliases

```ts
import { ... } from 'upgrade_types';           // shared types package
import { ... } from '@shared-component-lib';   // standalone component library
```

## Test Coverage Target

81%+ statements. Do not regress below current coverage.
