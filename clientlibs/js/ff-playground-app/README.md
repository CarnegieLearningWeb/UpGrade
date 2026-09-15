# Feature Flag Playground

A minimal Angular app for trying out the recipes in
[`../feature-flags-guide.md`](../feature-flags-guide.md) against a real, running UpGrade backend.

There are only two source files:

- `src/app/feature-flag-playground.service.ts` — **the file to edit.** All `upgrade_client_lib`
  usage lives here. `login()` currently uses the recommended ephemeral-mode recipe for the square,
  and an ad-hoc `groupsets` override for the circles. Alternate recipes (stored mode, merged mode)
  are included as commented-out blocks — swap them in to see how behavior changes.
- `src/app/app.ts` — a single barebones component: a login form (user id + repeatable
  group-type/values rows) and, once logged in, the two flag displays described below.

## Prerequisites

1. The UpGrade backend running locally at `http://localhost:3030` (`docker-compose up` from the
   repo root, or however you normally run it). CORS already allows any `localhost` port, so the
   Angular dev server's port doesn't matter.
2. Two feature flags created via the admin UI, both under context **`upgrade-internal`**:
   - `SQUARE_COLOR_FLAG_FOR_USER` — drives the square. Include/exclude it by whatever
     class/school/district/instructor groups you plan to log in with.
   - `SCHOOL_CIRCLE_FLAG` — drives the per-schoolId circles. Since each circle is checked as its
     own ephemeral groupset containing only that one schoolId, scope this flag's inclusion by
     `schoolId` if you want some circles green and others red.

   Until these exist, everything will just show as "off" (red) — that's expected, not a bug.

## Running it

```bash
yarn install   # first time only; also re-run this after rebuilding the SDK (see below)
yarn start     # ng serve, on http://localhost:4300 (4200 is reserved for the UpGrade admin UI)
```

## Using it

1. Enter a user id, or leave it blank to have one generated.
2. Add zero or more group rows — pick a type (`classId` / `schoolId` / `districtId` /
   `instructorId`) and type comma-separated values.
3. Click **Log in**. This does not call `init()` — it configures an ephemeral-mode
   `UpgradeClient` with exactly the groups you entered, and fetches both flags.
4. The square is colored by `SQUARE_COLOR_FLAG_FOR_USER` for the whole set of groups you entered.
   The circles row shows one circle per `schoolId` you entered, each independently colored by
   `SCHOOL_CIRCLE_FLAG` for that one schoolId. If you didn't enter any schoolIds, it says so
   instead of showing an empty row.
5. **Log out** and repeat with different groups/ids to compare.

## Picking up SDK changes

This app depends on `upgrade_client_lib` via a local `file:` dependency pointing at
`../packages/full-browser` (which `npm run build` in `clientlibs/js` populates from `../dist/browser`).
After changing the client library source:

```bash
cd ../ && npm run build     # rebuilds clientlibs/js, including packages/full-browser
cd ff-playground-app && yarn install --offline   # re-copies the local dependency
```

`yarn start` needs to be restarted afterward to pick up the change (Angular's dev server does not
watch outside `src/`).
