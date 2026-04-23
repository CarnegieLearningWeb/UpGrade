# UpGrade Monorepo

## Structure

Yarn workspaces monorepo. The workspace packages are `packages/*` only — `clientlibs/*` is NOT part of the Yarn workspace.

```
packages/
  backend/     NestJS-style Express API (routing-controllers + TypeDI)
  frontend/    Angular 20+ app with ngrx
  types/       Shared TypeScript types — imported as `upgrade_types` alias

clientlibs/
  js/          Multi-target TypeScript SDK (browser/node/lite)
  java/        Java client library
  csharp/      C# client library
```

**CRITICAL — Legacy directories:** The root-level `/backend`, `/frontend`, and `/types` directories are deprecated. Always work in `/packages/backend`, `/packages/frontend`, `/packages/types`.

## Running Package Scripts

Use workspace commands from the repo root:

```bash
yarn workspace upgrade-backend <script>
yarn workspace upgrade-frontend <script>
```

Or `cd` into the package and run scripts directly.

## Shared Type Alias

All packages import shared types using the `upgrade_types` alias — never with relative paths:

```ts
import { EXPERIMENT_STATE, IFeatureFlag } from 'upgrade_types';
```

This alias is configured in each package's `tsconfig.json` paths. If you add new types to `packages/types`, rebuild it (`npm run build` in that package) for consumers to pick up changes locally.

## Pre-commit Hooks

Husky runs automatically on `git commit`:
- `lint-staged` — Prettier + ESLint on staged files
- `yarn workspace upgrade-frontend typecheck`
- `yarn workspace upgrade-backend typecheck`

Both typechecks must pass. Do not bypass with `--no-verify`.

## Code Style

- **Prettier:** singleQuote, 120 printWidth, trailingComma es5
- **ESLint:** TypeScript + Angular rules, extends prettier config
- Auto-fix: `yarn prettier:write` (root) or `npm run prettier:write` in a package

## Local Development

```bash
docker-compose up   # frontend :4200, backend :3030, postgres :5432
```

Environment files: copy `packages/backend/.env.example` to `packages/backend/.env` for local dev.

## Package Versions

All packages are versioned together (currently v6.5.0). Keep versions in sync when bumping.
