# UpGrade Python Client Library — Build Plan

## Goal

Produce a publishable, installable Python package on PyPI that provides full feature parity with the existing JS and Java UpGrade client libraries. The library will target the UpGrade v6 client API.

---

## Phase 1: Project Scaffolding and Infrastructure

Set up the Python package structure, tooling, and CI foundation before writing any library code.

### Tasks

- Initialize package layout using `src/` layout convention:
  ```
  clientlibs/python/
  ├── src/
  │   └── upgrade_client_lib/
  │       ├── __init__.py
  │       ├── client.py
  │       ├── assignment.py
  │       ├── api_service.py
  │       ├── data_service.py
  │       ├── types/
  │       │   ├── __init__.py
  │       │   ├── enums.py
  │       │   ├── requests.py
  │       │   └── responses.py
  │       └── exceptions.py
  ├── tests/
  ├── pyproject.toml
  ├── README.md
  └── .python-version
  ```
- Configure `pyproject.toml` with:
  - Package metadata (name, version, description, authors, license, classifiers)
  - Python `>=3.9` minimum version requirement
  - Runtime dependencies: `httpx` (async-capable HTTP), `pydantic` (request/response models)
  - Dev dependencies: `pytest`, `pytest-asyncio`, `respx` (httpx mock), `ruff`, `mypy`
  - Build backend: `hatchling` or `flit`
- Configure `ruff` for linting and formatting
- Configure `mypy` for strict type checking
- Set up `pytest` with `pytest-asyncio` for async test support
- Add a `Makefile` or `justfile` with targets: `lint`, `test`, `build`, `publish`

### Deliverable

An installable (but empty) package skeleton that passes linting and a placeholder test.

---

## Phase 2: Types, Models, and Enums

Define all data structures used across request/response flows. Mirrors the types layer in the JS library (`src/types/`) and request/response beans in Java.

### Enums

```python
class MarkedDecisionPointStatus(str, Enum):
    CONDITION_APPLIED = "condition applied"
    CONDITION_FAILED_TO_APPLY = "condition not applied"
    NO_CONDITION_ASSIGNED = "no condition assigned"

class ExperimentType(str, Enum):
    SIMPLE = "Simple"
    FACTORIAL = "Factorial"

class PayloadType(str, Enum):
    STRING = "string"
    JSON = "json"
    CSV = "csv"

class BinaryRewardValue(str, Enum):
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"

class MetricMetaData(str, Enum):
    CONTINUOUS = "continuous"
    CATEGORICAL = "categorical"
```

### Request Models (Pydantic)

- `InitializeUserRequest` — userId, group, workingGroup
- `SetGroupMembershipRequest` — id, group
- `SetWorkingGroupRequest` — id, workingGroup
- `AssignRequest` — userId, context
- `MarkDecisionPointRequest` — userId, site, target, status, condition, uniquifier, clientError
- `LogRequest` — userId, value (list of `LogInput`)
- `LogInput` — userId, timestamp, metrics (`LogMetrics`)
- `LogMetrics` — attributes, groupedMetrics (list of `LogGroupMetrics`)
- `LogGroupMetrics` — groupClass, groupKey, groupUniquifier, attributes
- `UserAliasRequest` — userId, aliases
- `FeatureFlagRequest` — userId, context
- `AddMetricsRequest` — metricUnit (list of `GroupMetric` or `SingleMetric`)
- `SendRewardRequest` — rewardValue (`BinaryRewardValue`), experimentId (optional), context (optional), decisionPoint (optional: site + target)

### Response Models (Pydantic)

- `InitializeUserResponse` — id, group, workingGroup
- `ExperimentAssignment` — site, target, experimentType, assignedCondition, assignedFactor
- `Condition` — id, conditionCode, payload
- `Factor` — level, payload
- `Payload` — type, value
- `FeatureFlag` — key, status, variationValue
- `MarkDecisionPointResponse` — userId, site, target, experimentId
- `LogEventResponse` — id, uniquifier, timeStamp, data
- `UserAliasResponse` — userId, aliases
- `SendRewardResponse` — message, request (rewardValue, experimentId, context, decisionPoint), reward (variable, value, mooclet, version, learner)
- `ErrorResponse` — message, httpStatusCode, type

### Deliverable

All models defined, type-checked by mypy, and unit tested with valid/invalid fixture data.

---

## Phase 3: HTTP Layer

Implement the HTTP communication layer that wraps `httpx`. Both sync and async interfaces are provided.

### `DefaultHttpClient`

- Wraps `httpx.Client` (sync) and `httpx.AsyncClient` (async)
- Sends `Content-Type: application/json` and `Authorization: Bearer <token>` headers
- Accepts a `clientSessionId` header on every request
- Raises `UpgradeApiError` (a library-defined exception) on non-2xx responses

### `ApiService`

Maps library operations to HTTP endpoints (v6):

| Method | HTTP | Endpoint |
|--------|------|----------|
| `init_user` | POST | `/api/v6/init` |
| `set_group_membership` | PATCH | `/api/v6/groupmembership` |
| `set_working_group` | PATCH | `/api/v6/workinggroup` |
| `get_all_experiment_conditions` | POST | `/api/v6/assign` |
| `mark_decision_point` | POST | `/api/v6/mark` |
| `get_all_feature_flags` | POST | `/api/v6/featureflag` |
| `log` | POST | `/api/v6/log` |
| `set_alt_user_ids` | PATCH | `/api/v6/useraliases` |
| `add_metrics` | POST | `/api/v6/metric` |
| `send_reward` | POST | `/api/v6/reward` |

Both sync and async variants for each method.

### Deliverable

HTTP layer fully tested with `respx` (httpx mock). All endpoints covered.

---

## Phase 4: Caching Layer

Implement `DataService` to cache experiment assignments and feature flags in memory, matching the behavior of the JS `DataService`.

- Store assignments keyed by `"{site}|{target}"`
- Store feature flags keyed by flag key
- Support `ignore_cache=True` bypass on fetch methods (matches Java's `ignoreCache` parameter)
- Cache is per-client-instance (not global)
- Cache is invalidated by re-calling `init()`

### Deliverable

`DataService` unit tested with cache-hit, cache-miss, and cache-bypass scenarios.

---

## Phase 5: Assignment Class

Implement the `Assignment` wrapper that provides a high-level interface over a raw `ExperimentAssignment` response, matching both JS and Java `Assignment` classes.

### Public Interface

```python
class Assignment:
    def get_condition(self) -> str: ...
    def get_payload(self) -> Payload | None: ...
    def get_experiment_type(self) -> ExperimentType: ...
    def get_factor_level(self, factor: str) -> str: ...       # Factorial only
    def get_factor_payload(self, factor: str) -> Payload | None: ...  # Factorial only
    @property
    def factors(self) -> list[str]: ...                        # Factorial only

    # Convenience mark method (delegates to UpgradeClient)
    async def mark_decision_point(
        self,
        status: MarkedDecisionPointStatus,
        uniquifier: str = "",
        client_error: str = "",
    ) -> MarkDecisionPointResponse: ...

    # Sync variant
    def mark_decision_point_sync(...) -> MarkDecisionPointResponse: ...
```

### Deliverable

`Assignment` unit tested for simple and factorial experiment types.

---

## Phase 6: Main Client (`UpgradeClient`)

Implement the primary public API class. Exposes both async and sync interfaces.

### Constructor

```python
class UpgradeClient:
    def __init__(
        self,
        user_id: str,
        host_url: str,
        context: str,
        token: str = "",
        client_session_id: str | None = None,   # auto-generated UUID if None
    ): ...
```

### Public Methods (Async)

| Method | Signature |
|--------|-----------|
| `init` | `async init(group=None, working_group=None) -> InitializeUserResponse` |
| `set_group_membership` | `async set_group_membership(group: dict) -> InitializeUserResponse` |
| `set_working_group` | `async set_working_group(working_group: dict) -> InitializeUserResponse` |
| `get_all_experiment_conditions` | `async get_all_experiment_conditions(ignore_cache=False) -> list[Assignment]` |
| `get_decision_point_assignment` | `async get_decision_point_assignment(site, target="") -> Assignment \| None` |
| `mark_decision_point` | `async mark_decision_point(site, target, condition, status, uniquifier="", client_error="") -> MarkDecisionPointResponse` |
| `get_all_feature_flags` | `async get_all_feature_flags(ignore_cache=False) -> list[FeatureFlag]` |
| `has_feature_flag` | `async has_feature_flag(key: str) -> bool` |
| `log` | `async log(metrics: list[LogInput]) -> list[LogEventResponse]` |
| `set_alt_user_ids` | `async set_alt_user_ids(aliases: list[str]) -> UserAliasResponse` |
| `add_metrics` | `async add_metrics(metrics: list[GroupMetric \| SingleMetric]) -> dict` |
| `send_reward` | `async send_reward(reward_value: BinaryRewardValue, experiment_id=None, context=None, decision_point=None) -> SendRewardResponse` |

### Sync Variants

Wrap each async method with a sync equivalent using `asyncio.run()` or a shared event loop helper, for use in non-async applications.

```python
client.init_sync(...)
client.get_decision_point_assignment_sync(...)
# etc.
```

### Static Constants

```python
UpgradeClient.MARKED_DECISION_POINT_STATUS = MarkedDecisionPointStatus
UpgradeClient.BINARY_REWARD_VALUE = BinaryRewardValue
```

### Deliverable

Full client tested with integration-style tests using mocked HTTP responses. All methods covered.

---

## Phase 7: Packaging and Distribution

Prepare the library for publication to PyPI.

### Tasks

- Finalize `pyproject.toml`:
  - Name: `upgrade-client-lib`
  - Version: `6.5.0` (matching JS library version for parity signaling)
  - Homepage and repository links to UpGrade GitHub
  - Trove classifiers (Python versions, license, topic)
- Write `README.md` with:
  - Installation instructions (`pip install upgrade-client-lib`)
  - Quick-start example (async and sync)
  - Full API reference summary
  - Link to UpGrade documentation
- Verify `python -m build` produces a clean sdist and wheel
- Test install from wheel in a clean virtualenv
- Configure PyPI publishing via Trusted Publisher (OIDC) in GitHub Actions
- Add CI workflow (`.github/workflows/python-publish.yml`) that publishes on tagged release

### Deliverable

Package published to TestPyPI. CI workflow validated end-to-end.

---

## Phase 8: Testing and Quality

Ensure the library is production-ready with comprehensive test and quality coverage.

### Test Coverage Targets

- Unit tests: all public methods, all model validations, all enum values
- Integration tests: full request/response cycle mocked at HTTP layer
- Edge cases: cache behavior, `None` returns for missing assignments, error responses, Factorial vs Simple experiment handling

### Quality Gates

- `mypy --strict` passes with zero errors
- `ruff` reports zero lint violations
- `pytest` coverage ≥ 90%
- All tests pass on Python 3.9, 3.10, 3.11, 3.12 (matrix CI)

### Deliverable

CI pipeline green across all Python versions. Coverage report published as CI artifact.

---

## Phase 9: Documentation and Release

- Finalize `CHANGELOG.md`
- Tag `v6.5.0` release in git
- Publish to PyPI production
- Add Python library entry to the root UpGrade repository `README.md` alongside JS and Java entries

---

## Dependency Decisions

| Concern | Choice | Rationale |
|---------|--------|-----------|
| HTTP | `httpx` | Native async/sync support; mirrors axios (JS) ergonomics |
| Data models | `pydantic v2` | Runtime validation, serialization, IDE-friendly types |
| Async test support | `pytest-asyncio` | Standard async pytest integration |
| HTTP mocking | `respx` | First-class httpx mock library |
| Linting/formatting | `ruff` | Fast, single-tool replacement for flake8 + isort + black |
| Type checking | `mypy` | Standard Python static type checker |
| Build backend | `hatchling` | Modern, PEP 517/518 compliant; simple configuration |

---

## Feature Parity Matrix

| Feature | JS | Java | Python |
|---------|----|------|--------|
| User initialization | ✓ | ✓ | Phase 6 |
| Group membership | ✓ | ✓ | Phase 6 |
| Working group | ✓ | ✓ | Phase 6 |
| Experiment assignments (cached) | ✓ | ✓ | Phase 6 |
| Decision point marking | ✓ | ✓ | Phase 6 |
| Assignment wrapper class | ✓ | ✓ | Phase 5 |
| Factorial experiment support | ✓ | ✓ | Phase 5 |
| Payload support | ✓ | ✓ | Phase 5 |
| Feature flags (cached) | ✓ | ✓ | Phase 6 |
| Metrics logging (grouped) | ✓ | ✓ | Phase 6 |
| Alternate user IDs | ✓ | ✓ | Phase 6 |
| Add metrics | ✓ | ✓ | Phase 6 |
| Async interface | ✓ | — | Phase 6 |
| Sync interface | — | ✓ | Phase 6 |
| Cache bypass (`ignore_cache`) | — | ✓ | Phase 4 |
| Adaptive experiment rewards | ✓ | — | Phase 6 |
| Session-only feature flag groups | ✓ | — | Post-v1 |
