"""Quick smoke test against a live UpGrade instance.

Run from the repo root:
    python clientlibs/python/quickTest.py

Or from this directory:
    python quickTest.py

Requires the library to be installed (or on PYTHONPATH).  From this directory:
    pip install -e .
"""

import asyncio
import time

import httpx

from upgrade_client_lib import UpgradeClient
from upgrade_client_lib.types.requests import LogGroupMetrics, LogInput, LogMetrics
from upgrade_client_lib.exceptions import UpgradeApiError

# ---------------------------------------------------------------------------
# Target URL — swap to point at a different environment
# ---------------------------------------------------------------------------
URL_LOCAL = "http://localhost:3030"
URL_ECS_QA = "https://apps.qa-cli.net/upgrade-service"
URL_ECS_STAGING = "https://apps.qa-cli.com/upgrade-service"

# ---------------------------------------------------------------------------
# Config — edit these to match your UpGrade setup
# ---------------------------------------------------------------------------
host_url = URL_LOCAL
context = "context_identifier_1"
site = "ts"
target = ""
status = UpgradeClient.MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
feature_flag_key = "TEST_FEATURE_FLAG"

user_id = f"quicktest_user_{int(time.time() * 1000)}"
group: dict = {"classId": ["STORED_USER_GROUP"]}
working_group: dict = {"classId": "STORED_USER_GROUP"}
alias = f"alias_{user_id}"

# Reward testing — set experiment_id to a real Thompson Sampling experiment UUID
# to test send_reward by experiment id.
experiment_id = "PASTE-EXPERIMENT-UUID-HERE"
reward_value = UpgradeClient.BINARY_REWARD_VALUE.SUCCESS

log_inputs = [
    LogInput(
        timestamp="2022-03-03T19:49:00.496",
        metrics=LogMetrics(
            attributes={
                "totalTimeSeconds": 41834,
                "totalMasteryWorkspacesCompleted": 15,
                "totalConceptBuildersCompleted": 17,
                "totalMasteryWorkspacesGraduated": 15,
                "totalSessions": 50,
                "totalProblemsCompleted": 249,
            },
            groupedMetrics=[
                LogGroupMetrics(
                    groupClass="conceptBuilderWorkspace",
                    groupKey="graphs_of_functions",
                    groupUniquifier="2022-02-03T19:48:53.861Z",
                    attributes={
                        "timeSeconds": 488,
                        "hintCount": 2,
                        "errorCount": 15,
                        "completionCount": 1,
                        "workspaceCompletionStatus": "GRADUATED",
                        "problemsCompleted": 4,
                    },
                )
            ],
        ),
    )
]

# ---------------------------------------------------------------------------
# Main test flow
# ---------------------------------------------------------------------------


async def quick_test() -> None:
    client = UpgradeClient(user_id=user_id, host_url=host_url, context=context)

    await do_init(client)
    await do_group_membership(client)
    await do_working_group_membership(client)
    await do_aliases(client)
    await do_assign(client)
    await do_assign_ignore_cache(client)
    condition = await do_get_decision_point_assignment(client)
    await do_feature_flags(client)
    await do_feature_flags_ignore_cache(client)
    await do_has_feature_flag(client)
    await do_mark(client, condition)
    await do_mark_no_assignment(client)
    await do_send_reward_by_experiment_id(client)
    await do_send_reward_by_decision_point(client)
    await do_log(client)


# ---------------------------------------------------------------------------
# Individual operations
# ---------------------------------------------------------------------------


async def do_init(client: UpgradeClient) -> None:
    try:
        response = await client.init()
        print(f"\n[Init response]: {response}")
    except Exception as error:
        log_error("Init", error)


async def do_group_membership(client: UpgradeClient) -> None:
    try:
        response = await client.set_group_membership(group)
        print(f"\n[Group response]: {response}")
    except Exception as error:
        log_error("Group", error)


async def do_working_group_membership(client: UpgradeClient) -> None:
    try:
        response = await client.set_working_group(working_group)
        print(f"\n[Working Group response]: {response}")
    except Exception as error:
        log_error("Working Group", error)


async def do_aliases(client: UpgradeClient) -> None:
    try:
        response = await client.set_alt_user_ids([alias])
        print(f"\n[Aliases response]: {response}")
    except Exception as error:
        log_error("Aliases", error)


async def do_assign(client: UpgradeClient) -> None:
    try:
        response = await client.get_all_experiment_conditions()
        print(f"\n[Assign response]: {response}")
    except Exception as error:
        log_error("Assign", error)


async def do_assign_ignore_cache(client: UpgradeClient) -> None:
    try:
        response = await client.get_all_experiment_conditions(ignore_cache=True)
        print(f"\n[Assign (ignore cache) response]: {response}")
    except Exception as error:
        log_error("Assign (ignore cache)", error)


async def do_get_decision_point_assignment(client: UpgradeClient) -> str | None:
    try:
        assignment = await client.get_decision_point_assignment(site, target)
        print(f"\n[Decision Point Assignment response]: {assignment}")

        if assignment is None:
            print("\n[Decision Point Assignment]: no assignment found")
            return None

        condition = assignment.get_condition()
        print(f"\n[Condition]: {condition}")

        exp_type = assignment.get_experiment_type()
        print(f"\n[Experiment Type]: {exp_type}")

        payload = assignment.get_payload()
        print(f"\n[Payload]: {payload}")

        if payload:
            print(f"\n[Payload value]: {payload.value}")

        return condition
    except Exception as error:
        log_error("Decision Point Assignment", error)
        return None


async def do_feature_flags(client: UpgradeClient) -> None:
    try:
        response = await client.get_all_feature_flags()
        print(f"\n[Feature Flags response]: {response}")
    except Exception as error:
        log_error("Feature Flags", error)


async def do_feature_flags_ignore_cache(client: UpgradeClient) -> None:
    try:
        response = await client.get_all_feature_flags(ignore_cache=True)
        print(f"\n[Feature Flags (ignore cache) response]: {response}")
    except Exception as error:
        log_error("Feature Flags (ignore cache)", error)


async def do_has_feature_flag(client: UpgradeClient) -> None:
    try:
        response = await client.has_feature_flag(feature_flag_key)
        print(f"\n[Has Feature Flag response]: {response}")
    except Exception as error:
        log_error("Has Feature Flag", error)


async def do_mark(client: UpgradeClient, condition: str | None) -> None:
    try:
        response = await client.mark_decision_point(
            condition=condition,
            status=status,
            site=site,
            target=target,
        )
        print(f"\n[Mark response]: {response}")
    except Exception as error:
        log_error("Mark", error)


async def do_mark_no_assignment(client: UpgradeClient) -> None:
    """Mark a decision point where no experiment is running (condition=None)."""
    try:
        response = await client.mark_decision_point(
            condition=None,
            status=UpgradeClient.MARKED_DECISION_POINT_STATUS.NO_CONDITION_ASSIGNED,
            site="nonexistent-site",
            target="nonexistent-target",
        )
        print(f"\n[Mark (no assignment) response]: {response}")
    except Exception as error:
        log_error("Mark (no assignment)", error)


async def do_send_reward_by_experiment_id(client: UpgradeClient) -> None:
    try:
        response = await client.send_reward(
            reward_value=reward_value,
            experiment_id=experiment_id,
        )
        print(f"\n[Send Reward (by experiment id) response]: {response}")
    except Exception as error:
        log_error("Send Reward (by experiment id)", error)


async def do_send_reward_by_decision_point(client: UpgradeClient) -> None:
    try:
        response = await client.send_reward(
            reward_value=reward_value,
            context=context,
            decision_point={"site": site, "target": target},
        )
        print(f"\n[Send Reward (by decision point) response]: {response}")
    except Exception as error:
        log_error("Send Reward (by decision point)", error)


async def do_log(client: UpgradeClient) -> None:
    try:
        response = await client.log(log_inputs)
        print(f"\n[Log response]: {response}")
    except Exception as error:
        log_error("Log", error)


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------


def log_error(function_context: str, error: Exception) -> None:
    if isinstance(error, UpgradeApiError):
        print(f"\n[{function_context} error]: HTTP {error.status_code} — {error.response_body}")
    else:
        print(f"\n[{function_context} error]: {error}")


if __name__ == "__main__":
    print(f"\n[quickTest] user_id={user_id}  host={host_url}  context={context}\n")
    asyncio.run(quick_test())
