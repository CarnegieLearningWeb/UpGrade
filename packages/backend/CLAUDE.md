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
