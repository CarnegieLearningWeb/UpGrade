---
name: setup-perftrace
description: Install temporary request-correlated performance tracing on the UpGrade backend client hot path and instrument the /v6 client endpoints with spans, so latency can be attributed span-by-span under load. Reproduces the log format and span conventions of the origin/reference/client-perftraces branch. Use when investigating slow or spiky client endpoints (/v6/assign, /v6/init, /v6/mark, /v6/featureflag, etc.), when asked to "add perf traces", "instrument the hot path", "find where the time goes", or when profiling a load test. Remove it afterwards with /teardown-perftrace.
---

# setup-perftrace

Installs a throwaway tracing harness. **This is never meant to be committed or maintained** — it is
applied to a branch, used to find something, then removed with `/teardown-perftrace`.

The harness is deliberately tiny: **one new file plus one three-line edit**. Everything else is
env-var driven. Keeping the footprint at two files is what makes teardown reliable.

## Scope

The UpGrade backend client hot path — the `/v6` (and `/v5`) client controllers and the services they
call. The outer envelope is registered globally, so it will cover any express route; the guidance
below is about the *client* endpoints because that is where load-test latency lives.

## The reference implementation is the source of truth

**`origin/reference/client-perftraces` is a complete, working instance of this harness.** It is not
an example to be loosely inspired by — it is the spec. The harness asset, the log format, the span
labels, and the choice of what to wrap all come from that branch, and a fresh install should be
indistinguishable from it on any file both have in common.

Fetch it before you do anything else, and keep referring back to it at every step:

```bash
git fetch origin reference/client-perftraces
B=origin/reference/client-perftraces; M=$(git merge-base origin/dev $B)

git diff --stat $M $B                          # the whole footprint
git diff $M $B -- packages/backend/src/api/    # every span, in context
git show $B:packages/backend/src/api/services/ExperimentAssignmentService.ts | grep -n tracePerf
```

> **Shell variables do not survive between Bash tool calls** — only the working directory does. Every
> snippet below that uses `$B` or `$M` must re-declare them on the same line, and the snippets are
> written that way. This is not cosmetic: with `$M` empty, the Step 8 drift check silently collapses
> from `git diff --quiet $M HEAD` to `git diff --quiet HEAD`, which reports CLEAN for every file on a
> clean tree — so a drifted file gets reference hunks applied to code that has moved underneath them.

This is the log format, and it is fixed by `perfTrace.ts` plus the label grammar — nothing else may
alter it:

```
[perf] ┌───── req=005w inflight=2 start=243915.094 POST /api/v6/assign
[perf] │ req=005w inflight=2 dur=1.204ms start=… end=… span=UserCheckMiddleware.getUserDoc
[perf] │ req=005w inflight=2 dur=8.771ms start=… end=… span=getAssignmentsAndExclusionsForUser(experiments=4)
[perf] └───── req=005w inflight=2 dur=21.412ms start=… end=… POST /api/v6/assign
```

Why it matters that the format is *exact*: these logs are read by diffing runs against each other —
before/after a fix, one branch against another, a load test against a baseline. Span labels are the
join key. A label that reads `assignExperiments(n=3)` on one branch and
`assignExperiments(experiments=3)` on another cannot be compared, and the count-in-label convention
(see [Conventions](#conventions-from-the-reference-branch)) is frequently the thing that cracks the
case. Reproduce labels character-for-character.

## What this skill does and does not do

**Does:** install the harness, wire the outer envelope, configure the local `.env`, **ask which
`/v6` client endpoints to instrument and then instrument them**, record a snapshot manifest for
teardown, verify the install.

**Does not:** invent new spans where the reference branch already has them, or instrument admin /
non-client routes. Depth is fixed by the reference, not chosen fresh each run —
over-instrumenting a hot path distorts the measurement and buries the signal, and the reference's
span set is already the product of that tuning.

---

## Step 1 — Preflight

```bash
ls packages/backend/src/lib/perf/perfTrace.ts 2>/dev/null && echo "ALREADY INSTALLED"
ls .claude/.perftrace/manifest.json 2>/dev/null && echo "MANIFEST EXISTS"
```

If either exists, stop and tell the user it is already installed — offer `/teardown-perftrace`
first. Do not reinstall over an existing manifest; that would overwrite the snapshot of the
*original* files with a snapshot of the *instrumented* ones, and teardown could never get back.

Also check the working tree is not mid-conflict (`git status`). Uncommitted work is fine — the
snapshot approach preserves it — but note in your summary which files you are about to touch.

## Step 2 — Snapshot before touching anything

Create the manifest directory (gitignored via `.claude/*`) and back up every file you are about to
modify, **before** modifying it.

```bash
mkdir -p .claude/.perftrace/backups
```

For each file to be **modified**, copy the current content to
`.claude/.perftrace/backups/<path-with-slashes-replaced-by-underscores>` and record its sha256.
For each file to be **created**, record only that it is new.

Write `.claude/.perftrace/manifest.json`:

```json
{
  "installedAt": "<ISO timestamp from `date -u +%Y-%m-%dT%H:%M:%SZ`>",
  "branch": "<git branch --show-current>",
  "files": [
    {
      "path": "packages/backend/src/lib/perf/perfTrace.ts",
      "action": "created"
    },
    {
      "path": "packages/backend/src/loaders/app/index.ts",
      "action": "modified",
      "backup": ".claude/.perftrace/backups/packages_backend_src_loaders_app_index.ts",
      "sha256Before": "<sha256 of the original>",
      "sha256AfterSetup": "<sha256 after your edit — fill this in at the end>"
    }
  ]
}
```

`sha256AfterSetup` is what lets teardown detect that a file was edited *after* setup (by the user,
or by you adding spans) and warn before overwriting. Compute with `shasum -a 256 <file> | cut -d' ' -f1`.

The two entries above are only the harness itself. **Step 8 appends one entry per instrumented
file**, and so must you if you add spans in a later turn — a span added to `FeatureFlagService.ts`
tomorrow must be snapshotted the same way, or teardown will miss it. A fully instrumented install
has around seven entries, not two.

## Step 3 — Install the harness

Copy the asset verbatim:

```bash
mkdir -p packages/backend/src/lib/perf
cp .claude/skills/setup-perftrace/assets/perfTrace.ts packages/backend/src/lib/perf/perfTrace.ts
```

Do not hand-write it and do not "improve" it. It encodes several non-obvious decisions (see
[Why the harness looks like this](#why-the-harness-looks-like-this)), and **it is what fixes the log
format** — the `┌`/`│`/`└` glyphs, the field order, `inflight`, the shared `performance.now()`
marks. Any edit to this file changes the format and breaks comparability with previous runs.

Confirm it is byte-identical to the reference:

```bash
git show origin/reference/client-perftraces:packages/backend/src/lib/perf/perfTrace.ts \
  | diff - packages/backend/src/lib/perf/perfTrace.ts && echo "IDENTICAL"
```

If that prints anything but `IDENTICAL`, prefer the reference's version — the checked-in asset has
drifted and the reference is authoritative.

## Step 4 — Register the envelope outermost

`packages/backend/src/loaders/app/index.ts` uses `createExpressServer(options)`, which builds the
app internally and gives no chance to register middleware ahead of the routes. Swap it for
`express()` + `useExpressServer(app, options)` — verified identical internally
(`createExpressServer` *is* `useExpressServer` with an internally-created app):

Take this edit from the reference verbatim, including its explanatory comment:

```bash
B=origin/reference/client-perftraces; M=$(git merge-base origin/dev $B)
git diff $M $B -- packages/backend/src/loaders/app/index.ts
```

```ts
import express, { Application } from 'express';
import { useExpressServer } from 'routing-controllers';
import { perfTraceMiddleware } from '../../lib/perf/perfTrace';

// useExpressServer(app, options) is exactly what createExpressServer(options) does internally, but
// against an app we own. Owning it lets us register the perf trace ahead of routing-controllers'
// own routes so the request envelope encloses CORS, body parsing, validation, the @UseBefore
// middlewares, the handler, and response serialization. A span registered inside the handler misses
// all of that, which is the gap between traced time and client-observed time.
const expressApp: Application = express();

expressApp.use(perfTraceMiddleware);

useExpressServer(expressApp, {
  /* ...existing options, unchanged... */
});

export default expressApp;
```

This placement is the whole point. A span registered inside a handler misses the `@UseBefore`
middleware, body parsing, class-validator, and response serialization — which is precisely the gap
between what the trace reports and what an external client measures.

Make this edit with the Edit tool, then **verify it landed**:

```bash
grep -n "createExpressServer\|useExpressServer\|perfTraceMiddleware" packages/backend/src/loaders/app/index.ts
```

Expect `useExpressServer` and `perfTraceMiddleware`, and no `createExpressServer`. Scripted
search-and-replace on this file has silently no-op'd before; a failed edit here is easy to miss
because everything still compiles and runs — you just get no `[perf]` output at all.

## Step 5 — Configure the local .env

`packages/backend/.env` only (gitignored). **Never touch `.env.example` or `.env.test`** — those are
tracked, and this harness must leave no committed trace.

**Check for an existing block first and replace it rather than appending:**

```bash
grep -n "PERF_TRACE" packages/backend/.env
```

`.env` is gitignored, so it does *not* reset when you switch branches. A previous install's block
will still be sitting there, and blindly appending gives you duplicate keys — dotenv takes the
first, so a stale `PERF_TRACE_PATHS` silently wins and you spend an hour wondering why isolation
isn't working. If a block exists, edit it in place; only append when there is none.

On a fresh branch a complete, correct block from a previous install is the *expected* case, not the
exception. Read it before changing anything: if all four keys are present exactly once and the
values are the defaults below, leave the file alone and say so in your summary. Rewriting it is
churn, and the diff-free outcome is the correct one.

```bash
PERF_TRACE_ENABLED=true
# 0 logs every child span — fine for low-rate manual runs. Raise to ~5 before a load test:
# console.log to a TTY is a synchronous write and will perturb what you are measuring.
# The ┌/└ request envelope is always logged regardless of this value.
PERF_TRACE_THRESHOLD_MS=0
# Empty traces every request. Set to isolate, e.g. /v6/assign
PERF_TRACE_PATHS=
# Applied after PERF_TRACE_PATHS, so an exclusion always wins. e.g. /v6/log,/v6/mark
PERF_TRACE_EXCLUDE_PATHS=
```

After writing, re-run the grep and confirm each key appears exactly once.

## Step 6 — Verify

```bash
cd packages/backend && npx tsc --noEmit && npx jest --config=jest.config.js test/unit
```

Note that this `cd` persists for every later Bash call in the session. Use absolute paths from here
on, or the cleanup `rm` at the end of this step fails with "No such file or directory".

### The `.env` block does not reach jest — pass the vars inline

**`NODE_ENV` is `test` for any jest run — jest defaults it, and `package-scripts.js` sets it
explicitly via `cross-env` — and `src/env.ts` loads `` `.env${NODE_ENV === 'test' ? '.test' : ''}` ``.
So under jest dotenv reads `.env.test`, which has no `PERF_TRACE` keys.** The block you just wrote
to `.env` is invisible to every command in this step, `enabled` is `false`, and the verification test
prints **zero `[perf]` lines**.

This failure is indistinguishable from a Step 4 edit that silently no-op'd. Do not go re-checking the
envelope wiring when you see no output here — check this first.

Do **not** fix it by adding keys to `.env.test`; that file is tracked, and the harness must leave no
committed trace. Instead pass the vars inline on each command. Shell-provided `process.env` wins,
because dotenv does not override variables that are already set:

```bash
PERF_TRACE_ENABLED=true npx jest --config=jest.config.js test/unit/tracefilter.test.ts
```

Only the jest path is affected. `npm start serve` and any load test run without `NODE_ENV=test`, so
they read the `.env` block normally — Step 5 is still doing real work for the user's actual runs.

Then prove the harness actually emits, with a throwaway test (delete it afterwards):

```ts
// packages/backend/test/unit/tracefilter.test.ts
import 'reflect-metadata';
import request from 'supertest';
jest.setTimeout(60000);
it('filter', async () => {
  const app = require('../../src/loaders/app').default;
  for (const p of ['init', 'assign', 'mark', 'featureflag'])
    await request(app).post(`/api/v6/${p}`).set('User-Id', 'u').send({ context: 'test' });
});
```

Run it four ways, varying only the inline env vars. Each mode is one command:

```bash
J="npx jest --config=jest.config.js test/unit/tracefilter.test.ts"
PERF_TRACE_ENABLED=true $J                                  # all four endpoints
PERF_TRACE_ENABLED=true PERF_TRACE_PATHS=/v6/assign $J      # assign only
PERF_TRACE_ENABLED=true PERF_TRACE_EXCLUDE_PATHS=/v6/mark $J  # everything but mark
PERF_TRACE_ENABLED=false $J                                 # zero [perf] lines
```

The test output is loud — every request 500s and winston logs a stack trace per request. Both are
expected: you are testing the envelope, not the endpoint, and the app under test has no DB. Filter
to just the envelope rather than reading it all:

```bash
... | grep -oE "\[perf\] [┌└].*POST /api/v6/[a-z]+"
```

For the disabled mode, assert on the count instead: `| grep -c "\[perf\]"` must print `0`.

Confirm every `┌` has a matching `└` in each mode — that pairing is what proves the `finish`/`close`
listeners fire, and it is the one thing the grep above makes easy to eyeball.

Delete the throwaway test (absolute path — see the `cd` note above), then fill in
`sha256AfterSetup` in the manifest for the two files installed so far.

At this point the envelope works. Everything after this adds spans inside it.

## Step 7 — Ask which endpoints to instrument

**Always ask, and default to all.** Use AskUserQuestion with `multiSelect: true`, listing the `/v6`
client endpoints from the [inventory](#span-inventory) with every one pre-selected. Skip the prompt
only when the user already named endpoints in their invocation (`/setup-perftrace assign` →
instrument `/v6/assign`, no question).

Two things are **not** part of the selection:

- **The two client middlewares are always instrumented**, whatever the user picks. `ClientLibMiddleware`
  and `UserCheckMiddleware` sit in front of essentially every client route, so auth and user-lookup
  time would otherwise be an unexplained gap between `┌` and the first child span. This costs nothing
  when the user narrows scope: `tracePerf*` no-ops outside a traced request, so `PERF_TRACE_PATHS`
  still isolates output to the endpoint under study.
- **`/v6/clearDB` is never instrumented.** It is a test-support route, not a hot path, and the
  reference branch leaves it alone.

## Step 8 — Instrument, per file, drift-aware

For each file in the [inventory](#span-inventory) that the selection requires, decide **verbatim or
by hand** based on whether that file has moved since the reference branch's base:

```bash
B=origin/reference/client-perftraces; M=$(git merge-base origin/dev $B)
git diff --quiet $M HEAD -- <file> && echo "CLEAN -> verbatim" || echo "DRIFTED -> hand-apply"
```

**CLEAN** — the file is byte-identical to what the reference instrumented. Take its hunks verbatim
so the labels are exact. Read the reference's version and apply the same edits:

```bash
B=origin/reference/client-perftraces; M=$(git merge-base origin/dev $B)
git diff $M $B -- <file>     # the exact hunks to reproduce
```

Do **not** `git checkout $B -- <file>` even when clean. It works today and silently reverts real
work the moment the file has any unrelated change you did not notice — and the whole point of the
drift check is to never be in that position.

**DRIFTED** — the surrounding code has changed. Hand-apply the spans following
[Conventions](#conventions-from-the-reference-branch), keeping the reference's label spelling
character-for-character even though the call site moved. **Name every hand-derived file in your
summary** so the user knows which ones to spot-check; that list is the honest edge of what this
skill can guarantee.

Before editing each file, **snapshot it and append it to the manifest** exactly as Step 2 does —
`action: "modified"`, `backup`, `sha256Before`, and `sha256AfterSetup` once the edit lands. A file
instrumented but not in the manifest is a file teardown will not restore.

Then typecheck and re-run the suite — span wrapping changes inferred types at call sites, and a
`tracePerfAsync` around a destructured return is the usual place it goes wrong:

```bash
cd packages/backend && npx tsc --noEmit && npx jest --config=jest.config.js test/unit
```

## Step 9 — Report

Report to the user: which endpoints were instrumented, which files were taken verbatim versus
hand-derived, how to switch modes, that traces will not appear under jest without inline vars, and
that `/teardown-perftrace` reverses all of it. If you left the `.env` block untouched because it was
already correct, say that explicitly — otherwise it reads as a skipped step.

---

## Span inventory

The full footprint of `origin/reference/client-perftraces`. Endpoint → the spans it needs and the
file they live in. Verify against the branch rather than trusting this table if the two disagree.

| Endpoint | Spans | File |
|---|---|---|
| *(always)* | `ClientLibMiddleware.getClientCheck`, `ClientLibMiddleware.jwtVerify` (sync) | `middlewares/ClientLibMiddleware.ts` |
| *(always)* | `UserCheckMiddleware.getUserDoc`, `UserCheckMiddleware.handleProvidedGroupsForSession` | `middlewares/UserCheckMiddleware.ts` |
| `POST /v6/init` | `experimentUserService.upsertOnChange` | `controllers/ExperimentClientController.v6.ts` |
| `PATCH /v6/groupmembership` | `experimentUserService.updateGroupMembership` | controller |
| `PATCH /v6/workinggroup` | `experimentUserService.updateWorkingGroup` | controller |
| `PATCH /v6/useraliases` | `experimentUserService.setAliasesForUser(aliases=N)` | controller |
| `POST /v6/reward` | `moocletRewardsService.sendReward` | controller |
| `POST /v6/mark` | `experimentAssignmentService.markExperimentPoint` | controller |
| " | 8 spans inside `markExperimentPoint` — `previewUserService.findOneFromCache`, `getCachedExperiments`, `checkUserOrGroupIsGloballyExcluded`, `experimentLevelExclusionInclusion`, `monitoredDecisionPointRepository.findOne`, `saveGroupExclusionDoc`, `updateEnrollmentExclusionDocumentsAndCheckEndingCriteria`, `monitoredDecisionPointRepository.saveRawJson` | `services/ExperimentAssignmentService.ts` |
| `POST /v6/assign` | `formatAssignments` (sync) | controller |
| " | 11 spans inside `getAllExperimentConditions` — `previewUserService.findOneFromCache`, `checkUserOrGroupIsGloballyExcluded`, `filterAndProcessGroupExperiments`, `getAssignmentsAndExclusionsForUser(experiments=N)`, `experimentLevelExclusionInclusion`, `processExperimentPools` (sync), `assignExperiments(experiments=N)` + per-item `assignExperiment(<id>)` and `getEnrollmentCountPerCondition(<id>)`, `getRepeatedEnrollmentCount`, `buildDecisionPoints` (sync) | `services/ExperimentAssignmentService.ts` |
| `POST /v6/log` | `experimentAssignmentService.dataLog(logs=N)` | controller |
| " | `createLogs(logs=N)` + per-item `createLog[<index>]` | `services/ExperimentAssignmentService.ts` |
| `POST /v6/featureflag` | `featureFlagService.getKeys` | controller |
| " | `getCachedFlagsForKeys`, `featureFlagLevelInclusionExclusion(flags=N)` | `services/FeatureFlagService.ts` |
| `DELETE /v6/clearDB` | *none — never instrumented* | — |

`getExperimentsForUser` in `ExperimentAssignmentService` is wrapped as a whole and is shared by the
mark and assign paths — include it if either endpoint is selected.

Note that `/v6/assign`'s top-level `getAllExperimentConditions` call is deliberately **not** wrapped
in the controller: the service method is instrumented from the inside, so a controller span would
only duplicate the envelope minus a few microseconds.

## Conventions from the reference branch

These are the rules the reference already applies. Follow them for a DRIFTED file, or for an
endpoint the reference never covered.

The goal is a timeline that **reconstructs with no unexplained gaps** — spans plus inter-span gaps
should sum to the envelope.

If you are extending past the inventory, work outside-in:

1. **Start with the envelope only.** Run it. Read the gap between `┌` and the first child span, and
   between the last child and `└`. Those are framework cost (parse/validate, serialize) and are
   usually 0.5–2.5ms. If one is large, that is your lead.
2. **Wrap the handler's top-level service call.** One span per endpoint. Now you know whether time
   is in the handler or in the middleware around it.
3. **Descend only into the span that dominates.** Wrap every `await` in that method, plus any
   obviously expensive synchronous block. Re-run, find the new dominant span, repeat.

What is worth a span:

- **Every `await` in the request pipeline** — each is a DB round trip, a cache read, or an external
  call. These are where the time is.
- **Synchronous CPU blocks** — deep clones, `new Set(bigArray)`, large `map`/`reduce`, JSON
  serialization. Use `tracePerfSync`. These matter far more than their own duration suggests:
  they block the event loop and inflate *other* concurrent requests. Wrapping them is how you catch
  a whole class of bug that per-request averages hide.
- **Fan-out** — wrap both the aggregate and each item (`assignExperiments(experiments=3)` plus
  `assignExperiment(<id>)`). The threshold keeps per-item spans quiet unless one is individually
  slow, which is exactly how you identify a single bad item.

Put **counts in the label** wherever a span's cost scales with a collection:
`getAssignmentsAndExclusionsForUser(experiments=4)`, `dataLog(logs=12)`,
`featureFlagLevelInclusionExclusion(flags=13)`. A duration without its N is not interpretable, and
this is frequently the thing that cracks the case.

**Label grammar — reproduce it exactly:**

| Shape | When | From the reference |
|---|---|---|
| `camelCaseService.methodName` | calling out into another injected service | `experimentUserService.upsertOnChange`, `featureFlagService.getKeys` |
| `ClassName.methodName` | inside a middleware | `ClientLibMiddleware.getClientCheck`, `UserCheckMiddleware.getUserDoc` |
| `methodName` (bare) | a private helper on the class being traced | `getCachedExperiments`, `processExperimentPools` |
| `label(thing=N)` | cost scales with a collection | `assignExperiments(experiments=3)`, `dataLog(logs=12)` |
| `label(<id>)` | one span per item of a fan-out | `assignExperiment(abc-123)` |
| `label[<index>]` | fan-out with no meaningful id | `createLog[0]` |

The canonical call shape is an arrow function, which preserves `this` and leaves the arguments
untouched — this is also why wrapping is a low-risk edit:

```ts
const result = await tracePerfAsync('service.method', () => this.service.method(a, b, logger));
const value = tracePerfSync('cpuBlock', () => this.cpuBlock(input));
```

Comment the non-obvious ones the way the reference does — a line saying *why* a count is in the
label (`// Experiment count is in the label because it sizes the IN (...) list on all four queries.`)
is worth more later than the span itself.

What **not** to wrap: trivial synchronous getters, pure field access, anything already inside a
wrapped span that cannot itself be slow. Every span is a `console.log` under load.

## Reading the output

**Reconstruct the timeline by subtraction.** Spans nest; the gaps between them are the
uninstrumented work. If spans plus gaps do not sum to the envelope, something significant is
unmeasured — go find it.

**`inflight` is the most important field.** With `inflight=1` throughout, you are not testing
concurrency and cannot draw conclusions about contention, no matter how the durations look. If a
load test shows `inflight=1`, the load generator is not producing concurrent requests at that
endpoint — fix that before interpreting anything else.

**Distinguishing the three causes of a spike** — this is what the shared clock is for:

| Signature | Cause |
|---|---|
| Several overlapping requests all inflate, landing on nearly the same `end` mark; a gap in the log where nothing completes | Stop-the-world stall: major GC, or a synchronous block on the event loop |
| One request inflates while `inflight` shows peers finishing normally | That request waited on something of its own — pool acquire, or a genuinely slow query |
| A trivial span (a 1-row `SELECT`) inflates *while fully overlapping* another request's known CPU-heavy span | Event-loop blocking by that span. The strongest signal available — a query that cannot be slow, made slow by a neighbour |

**A clean floor with occasional spikes is not pool saturation.** Pool exhaustion raises the floor.
Bimodal-with-a-clean-floor points at a discrete stop-the-world event instead.

**Cold-start artifacts.** node-postgres defaults `idleTimeoutMillis` to 10s and `max` to 10. A
request arriving after >10s idle re-establishes connections; a 4-query `Promise.all` opens four at
once. Before reading anything into a slow isolated request, fire two back-to-back under 10s apart —
if the second is fast, it was connection establishment.

**Client-observed time will exceed the envelope**, by network RTT plus the load generator's own
overhead. At high thread counts JMeter is often CPU-bound itself. Don't chase that gap as if it were
server time.

**Before concluding "slow query", measure it.** Capture the real SQL (set `TYPEORM_LOGGING=true`, or
attach a capturing `logger` to a `DataSource`) and run `EXPLAIN (ANALYZE, BUFFERS)` twice, reading
the second. `shared hit` vs `shared read` tells you memory vs disk. Repeatedly in this codebase the
server-side execution has been ~0.05ms while the app saw 3ms — meaning the cost was round trip and
pool contention, not the query. That distinction changes the fix entirely: caching removes the round
trip, whereas indexing would do nothing.

## Why the harness looks like this

Decisions that are load-bearing — do not "simplify" them away:

- **Registered before `useExpressServer`.** Anywhere else and it misses middleware and serialization.
- **`tracePerf*` no-ops outside a traced request.** Global middleware runs on excluded endpoints too;
  without this gate their spans print unattributed and `PERF_TRACE_PATHS` stops isolating anything.
- **Envelope ignores the threshold, children respect it.** Guarantees a `┌` always has its `└`.
- **`inflight` logged before decrement**, so a request is counted in its own closing line.
- **Both `finish` and `close` listeners**, so a client abort cannot leak the counter.
- **Config read from `process.env`, not the typed `env` module.** Keeps the harness to one file so
  teardown has almost nothing to unwind. `import '../../env'` is there purely so dotenv has run.
- **A monotonic base-36 counter, not a uuid** — the hot path should not allocate to make an id.

## Teardown

`/teardown-perftrace` restores from the manifest. Keep the manifest accurate as you add spans, or
teardown will leave instrumentation behind.
