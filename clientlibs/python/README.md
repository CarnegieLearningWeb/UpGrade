# upgrade-client-lib

Python client library for the [UpGrade](https://github.com/CarnegieLearningWeb/UpGrade) experimentation platform.

Supports Python 3.9+ with both async and synchronous interfaces.

## Installation

```bash
pip install upgrade-client-lib
```

## Quick Start

### Async

```python
import asyncio
from upgrade_client_lib import UpgradeClient

async def main():
    client = UpgradeClient(
        user_id="user-123",
        host_url="https://your-upgrade-instance.com",
        context="my-app",
        token="your-token",          # optional
        client_session_id="sess-1",  # optional, auto-generated if omitted
    )

    await client.init()

    # Experiment assignments
    assignment = await client.get_decision_point_assignment("home", "banner")
    if assignment:
        condition = assignment.get_condition()   # e.g. "treatment"
        payload   = assignment.get_payload()     # Payload | None
        await assignment.mark_decision_point(
            UpgradeClient.MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
        )

    # Feature flags
    if await client.has_feature_flag("new-dashboard"):
        pass  # enable feature

asyncio.run(main())
```

### Sync

```python
from upgrade_client_lib import UpgradeClient

client = UpgradeClient("user-123", "https://your-upgrade-instance.com", "my-app")
client.init_sync()

assignment = client.get_decision_point_assignment_sync("home", "banner")
if assignment:
    condition = assignment.get_condition()
    assignment.mark_decision_point_sync(
        UpgradeClient.MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
    )
```

## API Reference

### `UpgradeClient(user_id, host_url, context, token="", client_session_id=None, timeout=5.0)`

| Parameter | Type | Description |
|---|---|---|
| `user_id` | `str` | Unique identifier for the user |
| `host_url` | `str` | Base URL of the UpGrade API server |
| `context` | `str` | Application context string scoping experiment/flag lookups |
| `token` | `str` | Optional bearer token for the `Authorization` header |
| `client_session_id` | `str \| None` | Optional session ID; auto-generated UUID when omitted |
| `timeout` | `float \| httpx.Timeout` | HTTP request timeout in seconds, or an `httpx.Timeout` object for fine-grained control. Defaults to `5.0` seconds, which matches httpx's own default and preserves the previous implicit behavior. |

To set a short timeout (e.g. for user-facing synchronous routes where you want fast failure):

```python
import httpx
from upgrade_client_lib import UpgradeClient

client = UpgradeClient(
    user_id="user-123",
    host_url="https://upgrade.example.com",
    context="my-app",
    timeout=0.5,  # 500 ms
)
```

For fine-grained control, pass an `httpx.Timeout` object:

```python
client = UpgradeClient(
    user_id="user-123",
    host_url="https://upgrade.example.com",
    context="my-app",
    timeout=httpx.Timeout(connect=1.0, read=5.0, write=5.0, pool=1.0),
)
```

The configured timeout applies to both the async (`httpx.AsyncClient`) and sync (`httpx.Client`) HTTP clients. Timeout errors raise `httpx.TimeoutException` and are not caught by the library.

Every method has an async variant (no suffix) and a synchronous variant (`_sync` suffix).

### Initialization

| Method | Description |
|---|---|
| `init(group=None, working_group=None)` | Initialize the user and clear the local cache |
| `set_group_membership(group)` | Update the user's group membership |
| `set_working_group(working_group)` | Update the user's working group |
| `set_alt_user_ids(aliases)` | Register alternate identifiers for this user |

### Experiments

| Method | Description |
|---|---|
| `get_all_experiment_conditions(ignore_cache=False)` | Return all `Assignment` objects for this user/context |
| `get_decision_point_assignment(site, target="")` | Return the `Assignment` for a specific decision point, or `None` |
| `mark_decision_point( condition, status, site, target = "", uniquifier="", client_error="")` | Record that the user encountered a decision point |

When no experiment is running at a decision point, mark it with `condition=None` and the `NO_CONDITION_ASSIGNED` status:

```python
assignment = client.get_decision_point_assignment_sync(
    site="problem-info",
    target="mathbook_tx",
)

if assignment is None:
    client.mark_decision_point_sync(
        condition=None,
        status=UpgradeClient.MARKED_DECISION_POINT_STATUS.NO_CONDITION_ASSIGNED,
        site="problem-info",
        target="mathbook_tx",
    )
else:
    condition = assignment.get_condition()
    assignment.mark_decision_point_sync(
        UpgradeClient.MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
    )
```

### Feature Flags

| Method | Description |
|---|---|
| `get_all_feature_flags(ignore_cache=False)` | Return all active `FeatureFlag` objects |
| `has_feature_flag(key)` | Return `True` if the named flag is active for this user |

### Metrics & Rewards

| Method | Description |
|---|---|
| `log(metrics)` | Send outcome metric events |
| `send_reward(reward_value, experiment_id=None, context=None, decision_point=None)` | Send a binary reward signal for an adaptive experiment |

`log()` accepts a list of `LogInput` objects. `LogInput`, `LogMetrics`, and `LogGroupMetrics` must be imported from `upgrade_client_lib.types`:

```python
from upgrade_client_lib.types import LogInput, LogMetrics, LogGroupMetrics

# Simple metrics
log = client.log_sync([
    LogInput(
        timestamp="2024-01-01T00:00:00Z",
        metrics=LogMetrics(attributes={"totalTimeSeconds": 95}),
    )
])

# With grouped metrics
log = client.log_sync([
    LogInput(
        timestamp="2024-01-01T00:00:00Z",
        metrics=LogMetrics(
            attributes={"totalTimeSeconds": 95},
            groupedMetrics=[
                LogGroupMetrics(
                    groupClass="quiz",
                    groupKey="quiz-1",
                    groupUniquifier="attempt-1",
                    attributes={"score": 80},
                )
            ],
        ),
    )
])
```

### `Assignment`

Returned by `get_all_experiment_conditions` and `get_decision_point_assignment`.

| Method / Property | Description |
|---|---|
| `get_condition()` | Assigned condition code (`""` when none) |
| `get_payload()` | Condition payload (`Payload \| None`) |
| `get_experiment_type()` | `ExperimentType.SIMPLE` or `ExperimentType.FACTORIAL` |
| `factors` | List of factor names (factorial experiments only) |
| `get_factor_level(factor)` | Assigned level for a factor (`str \| None`) |
| `get_factor_payload(factor)` | Payload for a factor (`Payload \| None`) |
| `mark_decision_point(status, uniquifier="", client_error="")` | Mark this decision point |

### Enums

Access via class attributes so no separate import is needed:

```python
UpgradeClient.MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
UpgradeClient.MARKED_DECISION_POINT_STATUS.CONDITION_FAILED_TO_APPLY
UpgradeClient.MARKED_DECISION_POINT_STATUS.NO_CONDITION_ASSIGNED

UpgradeClient.BINARY_REWARD_VALUE.SUCCESS
UpgradeClient.BINARY_REWARD_VALUE.FAILURE
```

## Error Handling

API errors raise `upgrade_client_lib.exceptions.UpgradeApiError`:

```python
from upgrade_client_lib.exceptions import UpgradeApiError

try:
    await client.init()
except UpgradeApiError as e:
    print(e.status_code, e.message)
```

## Links

- [UpGrade repository](https://github.com/CarnegieLearningWeb/UpGrade)
- [UpGrade documentation](https://upgradeplatform.io)
