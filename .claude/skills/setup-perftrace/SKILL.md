---
name: setup-perftrace
description: Install temporary request-correlated performance tracing on the UpGrade backend client hot path, so latency can be attributed span-by-span under load. Use when investigating slow or spiky client endpoints (/v6/assign, /v6/init, /v6/mark, /v6/featureflag, etc.), when asked to "add perf traces", "instrument the hot path", "find where the time goes", or when profiling a load test. Remove it afterwards with /teardown-perftrace.
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

## What this skill does and does not do

**Does:** install the harness, wire the outer envelope, configure the local `.env`, record a
snapshot manifest for teardown, verify the install.

**Does not:** add spans to controllers or services. That is a separate, deliberate step — the
user asks for spans on a specific endpoint, and you apply the strategy in
[Choosing what to wrap](#choosing-what-to-wrap). Do not pre-emptively instrument everything;
over-instrumenting a hot path distorts the measurement and buries the signal.

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

**Append to the manifest every time you later add spans to a new file.** A span added to
`FeatureFlagService.ts` in a follow-up turn must be snapshotted the same way, or teardown will miss it.

## Step 3 — Install the harness

Copy the asset verbatim:

```bash
mkdir -p packages/backend/src/lib/perf
cp .claude/skills/setup-perftrace/assets/perfTrace.ts packages/backend/src/lib/perf/perfTrace.ts
```

Do not hand-write it and do not "improve" it. It encodes several non-obvious decisions (see
[Why the harness looks like this](#why-the-harness-looks-like-this)).

## Step 4 — Register the envelope outermost

`packages/backend/src/loaders/app/index.ts` uses `createExpressServer(options)`, which builds the
app internally and gives no chance to register middleware ahead of the routes. Swap it for
`express()` + `useExpressServer(app, options)` — verified identical internally
(`createExpressServer` *is* `useExpressServer` with an internally-created app):

```ts
import express, { Application } from 'express';
import { useExpressServer } from 'routing-controllers';
import { perfTraceMiddleware } from '../../lib/perf/perfTrace';

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

## Step 5 — Configure the local .env

`packages/backend/.env` only (gitignored). **Never touch `.env.example` or `.env.test`** — those are
tracked, and this harness must leave no committed trace.

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

## Step 6 — Verify

```bash
cd packages/backend && npx tsc --noEmit && npx jest --config=jest.config.js test/unit
```

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

Run it four ways and confirm each: all endpoints traced; `PERF_TRACE_PATHS=/v6/assign` yields only
assign; `PERF_TRACE_EXCLUDE_PATHS=/v6/mark` drops mark; `PERF_TRACE_ENABLED=false` yields zero
`[perf]` lines. A 500 from the handler is fine — you are testing the envelope, not the endpoint.

Report to the user: files touched, how to switch modes, and that `/teardown-perftrace` reverses it.

---

## Choosing what to wrap

Do this when the user asks for spans on a specific endpoint. The goal is a timeline that
**reconstructs with no unexplained gaps** — spans plus inter-span gaps should sum to the envelope.

Work outside-in:

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

Label convention: `serviceName.methodName` for service calls, bare method name for private helpers
in the class being traced.

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
