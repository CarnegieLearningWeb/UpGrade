# Client Library Parity Audit

Audit of `clientlibs/js`, `clientlibs/java`, and `clientlibs/python` against each other and against the backend's
`/api/v6` client controller (`packages/backend/src/api/controllers/ExperimentClientController.v6.ts`), as of `dev`
@ `9e6bf1631`.

## 1. Endpoint coverage

Backend `/v6` client endpoints vs. what each lib calls:

| Backend endpoint | JS | Java | Python |
|---|---|---|---|
| `POST init` | `init` | `init` (3 overloads) | `init` |
| `PATCH groupmembership` | `setGroupMembership` | `setGroupMembership` | `set_group_membership` |
| `PATCH workinggroup` | `setWorkingGroup` | `setWorkingGroup` | `set_working_group` |
| `PATCH useraliases` | `setAltUserIds` | `setAltUserIds` | `set_alt_user_ids` |
| `POST assign` | `getAllExperimentConditions` | `getAllExperimentConditions` | `get_all_experiment_conditions` |
| `POST mark` | `markDecisionPoint` | `markDecisionPoint` (8 overloads) | `mark_decision_point` |
| `POST log` | `log` | `log` | `log` |
| `POST featureflag` | `getAllFeatureFlags` / `hasFeatureFlag` | `getAllFeatureFlags` / `hasFeatureFlag` | `get_all_feature_flags` / `has_feature_flag` |
| `POST reward` | `sendReward` | **missing** | `send_reward` |
| `POST reward?awaitResult=` | **missing** | **missing** | `await_result=` |

Calls to endpoints the backend **no longer serves** (these return 404):

| Lib | Method | Calls | Status |
|---|---|---|---|
| JS | `logCaliper()` | `POST /v6/log/caliper` | Removed from the backend in #1985 (Sep 2024). Only pre-v5 controllers had it. |
| Java | `addGroupMetrics()`, `addSingleMetrics()` | `POST /v6/metric` | No such client route. `MetricController` is `/metric`, admin-authorized, and has only `GET`, `POST /save`, and `DELETE`. |

## 2. Feature-level differences

### 2.1 Feature flags
- **Session-scoped groups (`groupsForSession` + `includeStoredUserGroups`)**: only JS supports these, via the
  constructor option `featureFlagUserGroupsForSession` and `setFeatureFlagUserGroupsForSession()`. The backend
  handles them in `UserCheckMiddleware` and validates them in `FeatureFlagRequestValidator`. **Java and Python can't
  send them.**
- Java *does* have basic feature flag support (`getAllFeatureFlags`, `hasFeatureFlag`), so "feature flags missing
  from Java" really means the session-groups option is missing.
- Return types differ: JS and Java return `string[]`/`List<String>`. Python returns `list[FeatureFlag]`, a wrapper
  model with only a `key` field.

### 2.2 Rewards (adaptive / Thompson Sampling)
- **Java has no reward support at all**: no method, no request/response beans, no `BINARY_REWARD_VALUE` enum.
- **JS `sendReward` can't pass `awaitResult`.** Its `ISendRewardResponse` is also out of date: it has no `mode`
  (`'accepted' | 'processed'`) or `success` fields, both of which the backend now returns.
- Python is up to date: `await_result` is supported and `SendRewardResponse` has `mode` and `success`.

### 2.3 Mark request payload
- **Java never sends `assignedCondition.experimentId`**, even from `Assignment.markDecisionPoint()`, where it has the
  `Condition` with the id in hand. It only builds `new Condition(code)`. JS and Python send the cached
  `experimentId`. Without it, the backend re-runs experiment selection for the decision point
  (`ExperimentAssignmentService`, around line 259). That costs extra work, and it can resolve to a different
  experiment when several share a decision point.
- JS spreads the whole cached `assignedCondition[0]` (`id`, `payload`, `experimentId`). Python sends `id` and
  `experimentId` plus `experimentType` and `assignedFactor`. The global `whitelist: true` validation strips the
  extra fields, so this is harmless, but it's sloppy.
- Positional argument order differs:
  - JS `(site, target, condition, status, uniquifier?, clientError?)`; there's also an options-object overload.
  - Java `(site, [target], condition, status, [clientError], [uniquifier], cb)`. **`clientError` comes before
    `uniquifier`, the reverse of JS.**
  - Python `(condition, status, site, target="", uniquifier="", client_error="")`. **condition and status come
    first.**

### 2.4 Assignment lookup semantics
| | JS | Java | Python |
|---|---|---|---|
| Site/target matching | exact | **case-insensitive** | exact |
| No experiment at decision point | `Assignment` with `conditionCode: null` | empty `Assignment` | **`None`** |
| Convenience getters | `getCondition()`, `getPayload()`, `getExperimentType()`, `factors`, `getFactorLevel`, `getFactorPayload` | no `getCondition()`/`getPayload()` (use `getAssignedCondition().getConditionCode()`); has `getFactorLevel`/`getFactorPayload` | same as JS |
| Within-subjects rotation of `assignedFactor` | yes | **no** (`setAssignedFactor(getAssignedFactor())` is a no-op) | yes |

### 2.5 Client-side state
| | JS | Java | Python |
|---|---|---|---|
| `init()` clears the cached assignments/flags | no | no | **yes** |
| `setGroupMembership`/`setWorkingGroup` update local state | yes (merged into the response) | no | no |
| `setFeatureFlagUserGroupsForSession` clears the flag cache | yes | n/a | n/a |

None of the libs invalidate cached assignments after `setGroupMembership`/`setWorkingGroup`/`setAltUserIds`, even
though those calls can change assignments.

## 3. Transport / reliability differences

| | JS (default client) | Java | Python |
|---|---|---|---|
| Retries | **effectively none** (see bug below) | 1 retry on network failure or 5xx | none |
| Timeout | **none** (axios default `0`) | 3s connect + 3s read; overridable via the `properties` map, despite CLAUDE.md saying it isn't configurable | 5s, configurable via `timeout=` |
| Auth token | optional | **required**: the constructor throws if empty | optional |
| Connection reuse | axios default agent | pooled Jersey client; must call `close()` | **new `httpx` client per request** (no pooling) |
| Error surface | `throw new Error(JSON.stringify(axiosError))` | `ErrorResponse` via callback | `UpgradeApiError(status_code, response_body)` |
| Extra headers | `URL`, `CurrentRetry` | none | none |
| API version | build-time `API_VERSION` | hard-coded `api/v6` | hard-coded `v6` |
| Custom HTTP client | yes (lite build) | via `properties` | no |

**JS `DefaultHttpClient` retry bug:** axios rejects any non-2xx response by default, so the `statusCode > 400 &&
statusCode < 500` retry branch in `fetchData` never runs. Every error goes straight to `catch` and is rethrown. The
dead branch has two more problems: it would retry **4xx** but not **5xx**, the reverse of Java's policy, and its
`> 400` check skips 400 itself.

**Java retries non-idempotent POSTs.** It retries `/mark` and `/log` on network failure. If the first request
reached the server, this can write duplicate log rows or marks.

## 4. Lib-specific quality issues found along the way
- **Python `_sync` methods use `asyncio.run()`**, which raises `RuntimeError` whenever an event loop is already
  running (Jupyter, or sync code called from inside an async framework). `ApiService` already has real sync
  implementations (`*_sync` using `httpx.Client`) that `UpgradeClient` never calls.
- **Java has no unit tests.** TestNG is declared, but there's no `src/test/java`; `QuickTest` is a manual
  integration scratchpad. JS (Jest) and Python (pytest) both have suites.
- **Java constructor NPEs if `properties` is `null`** (`properties.entrySet()` in `APIService.createClient`).
- **Java callbacks NPE when `null` in `failed()`**: every `failed()` handler calls `callbacks.onError(...)` with no
  null check, unlike `completed()`.
- **JS `markDecisionPoint` throws a `TypeError`** if the preceding `/assign` failed or returned a non-array, because
  `experimentAssignmentData` stays `null` and `findExperimentAssignmentBySiteAndTarget` calls `.find` on it.
- **JS `index.d.ts`** (generated by `dts-bundle-generator` at build time and gitignored) still types `logCaliper`,
  because the source still has it.
- **Java populated its caches *after* invoking `onSuccess`** in `getAllExperimentConditions` and
  `getAllFeatureFlags`, so a `markDecisionPoint` or `hasFeatureFlag` chained from inside the callback could see a
  cold cache. *(Fixed in Phase A.)*
- **Python `Assignment.mark_decision_point()` doesn't rotate the within-subjects cache.** Rotation lives only in
  `UpgradeClient.mark_decision_point()`. JS rotates for both paths because rotation lives in `ApiService`.
- **Python `__version__`** in `upgrade_client_lib/__init__.py` is `"6.5.0"`; `pyproject.toml` is `6.8.0`.
- **Java site/target `markDecisionPoint` with a cold cache** sends no `experimentId`. JS and Python fetch
  assignments first. Phase A kept Java's behavior unchanged here rather than adding a fetch, which could fail.
- **JS `ApiService.spec.ts`** had 3 failing `markDecisionPoint` tests on `dev`: the expected bodies were missing the
  `context` field the source has sent since 6.6. *(Fixed in Phase A.)*
- **Docs drift:** `java/CLAUDE.md` said timeouts aren't configurable (they are, via `properties`). *(Fixed in
  Phase A.)*

## 5. Proposed reconciliation plan

**Phase A: correctness fixes, no API decisions needed** *(done on `feature/clientlib-parity-phase-a`)*
1. Java: send `experimentId` (and `id`) on mark. Both `Assignment.markDecisionPoint` and the `site`/`target`
   overloads should look it up from the cached assignments, like JS and Python do.
2. Java: rotate `assignedFactor` alongside `assignedCondition`.
3. JS: fix `DefaultHttpClient` retries: retry network errors and 5xx, not 4xx, with the existing backoff; add a
   default timeout.
4. JS: add `mode`/`success` to `ISendRewardResponse`; guard `markDecisionPoint` against a null assignment cache.
5. Java: null-safe `failed()` callbacks and `properties`.
6. Python: route `_sync` methods through `ApiService`'s existing sync implementations instead of `asyncio.run()`;
   reuse one `httpx` client per `UpgradeClient`.

**Phase B: feature parity**
1. Java: add reward support (request/response beans, `BinaryRewardValue` enum). *Decided shape:*
   - Two named methods, one per lookup form the backend accepts, so invalid combinations don't compile:
     `sendRewardForExperiment(value, experimentId, cb)` and
     `sendRewardForDecisionPoint(value, context, site, target, cb)`.
   - `context` is passed explicitly, matching JS and Python. The client doesn't fill in its own context.
   - `awaitResult` is a trailing boolean overload of each method (default `false`), like
     `getAllExperimentConditions(ignoreCache, cb)`.
2. JS: add `awaitResult` to `sendReward`.
3. Java and Python: add feature-flag `groupsForSession` / `includeStoredUserGroups` support. *Decided shape:*
   - Both libs get a setter that requires both fields together (like JS's validation) and clears the flag cache.
   - **Python** also gets a `feature_flag_user_groups_for_session=` constructor kwarg, mirroring JS.
   - **Java** is setter-only. Java has no optional parameters, so a constructor option would double the
     constructors (2 → 4) for no extra capability. If the constructor list keeps growing, move to a builder or
     options object rather than adding overloads.
4. Remove dead endpoints: JS `logCaliper`, Java `addGroupMetrics`/`addSingleMetrics`. These are breaking removals of
   public methods, but those methods already fail with a 404 on every call. *Decided:* delete them, with no version
   bump; versions stay in lockstep and get bumped with the normal release. Confirmed that MATHia doesn't use the
   Java methods.

**Phase C: harmonize semantics (behavior changes, needs a decision on each)**
- Site/target matching: exact everywhere, or case-insensitive everywhere.
- "No experiment at decision point": return an empty `Assignment` or null, consistently.
- Whether `init()` clears the cache in every lib, or in none.
- Retry policy and default timeout, with one documented value across all three.
- Java `markDecisionPoint` `clientError`/`uniquifier` order, and Python's `condition`-first order. Fixing either
  breaks existing callers, so it may be better to document than change.
- Java auth token: optional, to match the others.

**Phase D: guardrails**
- Add a Java unit test suite (at least request serialization for each endpoint).
- Add a shared, language-neutral endpoint contract checklist (or contract tests against the backend's swagger) so
  future backend changes show up as drift.
