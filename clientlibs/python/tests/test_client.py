"""Integration-style tests for UpgradeClient (Phase 6).

HTTP is mocked at the httpx transport layer with respx, so every test
exercises the full UpgradeClient → ApiService → httpx stack.
"""

import json

import respx
from httpx import Response

from upgrade_client_lib.client import UpgradeClient
from upgrade_client_lib.types.enums import BinaryRewardValue, ExperimentType, MarkedDecisionPointStatus
from upgrade_client_lib.types.requests import LogInput, LogMetrics

HOST = "https://upgrade.example.com"
USER = "user-abc"
CTX = "test-app"
BASE = f"{HOST}/api/v6"

# ---------------------------------------------------------------------------
# Shared payloads
# ---------------------------------------------------------------------------

USER_PAYLOAD = {"id": USER, "group": None, "workingGroup": None}

ASSIGNMENT_PAYLOAD = [
    {
        "site": "home",
        "target": "banner",
        "experimentType": "Simple",
        "assignedCondition": [
            {"id": "cond-1", "conditionCode": "control", "payload": None, "experimentId": "exp-1"}
        ],
        "assignedFactor": None,
    }
]

FACTORIAL_PAYLOAD = [
    {
        "site": "quiz",
        "target": "hint",
        "experimentType": "Factorial",
        "assignedCondition": [
            {"id": "cond-A", "conditionCode": "combo-A", "payload": None, "experimentId": "exp-2"},
            {"id": "cond-B", "conditionCode": "combo-B", "payload": None, "experimentId": "exp-2"},
        ],
        "assignedFactor": [
            {"color": {"level": "red", "payload": None}},
            {"color": {"level": "blue", "payload": None}},
        ],
    }
]

MARK_PAYLOAD = {
    "id": "mark-1",
    "userId": USER,
    "site": "home",
    "target": "banner",
    "experimentId": "exp-1",
    "condition": "control",
}

LOG_PAYLOAD = [{"id": 1, "uniquifier": "u1", "timeStamp": "2024-01-01T00:00:00Z", "data": {}}]

ALIAS_PAYLOAD = {"userId": USER, "aliases": ["alias-1"]}

REWARD_PAYLOAD = {
    "message": "ok",
    "request": {"rewardValue": "SUCCESS"},
    "reward": {"variable": "score", "value": 1.0, "mooclet": 1, "version": 1, "learner": USER},
}


def make_client(**kwargs: object) -> UpgradeClient:
    return UpgradeClient(
        user_id=USER,
        host_url=HOST,
        context=CTX,
        token="tok",
        **kwargs,  # type: ignore[arg-type]
    )


# ---------------------------------------------------------------------------
# Constructor
# ---------------------------------------------------------------------------


class TestConstructor:
    def test_auto_generates_session_id(self) -> None:
        c1 = make_client()
        c2 = make_client()
        # Each instance gets a unique session id
        assert c1._api_service._client_session_id != c2._api_service._client_session_id

    def test_uses_provided_session_id(self) -> None:
        c = make_client(client_session_id="my-session")
        assert c._api_service._client_session_id == "my-session"

    def test_static_constants(self) -> None:
        assert UpgradeClient.MARKED_DECISION_POINT_STATUS is MarkedDecisionPointStatus
        assert UpgradeClient.BINARY_REWARD_VALUE is BinaryRewardValue

    def test_package_import(self) -> None:
        from upgrade_client_lib import UpgradeClient as UC

        assert UC is UpgradeClient


# ---------------------------------------------------------------------------
# init
# ---------------------------------------------------------------------------


class TestInit:
    @respx.mock
    async def test_calls_api(self) -> None:
        respx.post(f"{BASE}/init").mock(return_value=Response(200, json=USER_PAYLOAD))
        result = await make_client().init()
        assert result.id == USER

    @respx.mock
    async def test_clears_cache(self) -> None:
        # Pre-populate the cache, then confirm init clears it.
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        respx.post(f"{BASE}/init").mock(return_value=Response(200, json=USER_PAYLOAD))
        client = make_client()
        await client.get_all_experiment_conditions()
        assert client._data_service.get_all_assignments() is not None
        await client.init()
        assert client._data_service.get_all_assignments() is None

    @respx.mock
    async def test_passes_group_and_working_group(self) -> None:
        route = respx.post(f"{BASE}/init").mock(return_value=Response(200, json=USER_PAYLOAD))
        await make_client().init(
            group={"cls": ["a"]}, working_group={"cls": "a"}
        )
        body = json.loads(route.calls[0].request.content)
        assert body["group"] == {"cls": ["a"]}
        assert body["workingGroup"] == {"cls": "a"}

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/init").mock(return_value=Response(200, json=USER_PAYLOAD))
        result = make_client().init_sync()
        assert result.id == USER


# ---------------------------------------------------------------------------
# set_group_membership / set_working_group
# ---------------------------------------------------------------------------


class TestGroupMethods:
    @respx.mock
    async def test_set_group_membership(self) -> None:
        respx.patch(f"{BASE}/groupmembership").mock(
            return_value=Response(200, json={"id": USER, "group": {"cls": ["a"]}, "workingGroup": None})
        )
        result = await make_client().set_group_membership({"cls": ["a"]})
        assert result.group == {"cls": ["a"]}

    @respx.mock
    def test_set_group_membership_sync(self) -> None:
        respx.patch(f"{BASE}/groupmembership").mock(
            return_value=Response(200, json={"id": USER, "group": {"cls": ["a"]}, "workingGroup": None})
        )
        result = make_client().set_group_membership_sync({"cls": ["a"]})
        assert result.group == {"cls": ["a"]}

    @respx.mock
    async def test_set_working_group(self) -> None:
        respx.patch(f"{BASE}/workinggroup").mock(
            return_value=Response(200, json={"id": USER, "group": None, "workingGroup": {"cls": "a"}})
        )
        result = await make_client().set_working_group({"cls": "a"})
        assert result.workingGroup == {"cls": "a"}

    @respx.mock
    def test_set_working_group_sync(self) -> None:
        respx.patch(f"{BASE}/workinggroup").mock(
            return_value=Response(200, json={"id": USER, "group": None, "workingGroup": {"cls": "a"}})
        )
        result = make_client().set_working_group_sync({"cls": "a"})
        assert result.workingGroup == {"cls": "a"}


# ---------------------------------------------------------------------------
# get_all_experiment_conditions
# ---------------------------------------------------------------------------


class TestGetAllExperimentConditions:
    @respx.mock
    async def test_cold_cache_fetches_api(self) -> None:
        route = respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        client = make_client()
        results = await client.get_all_experiment_conditions()
        assert route.call_count == 1
        assert len(results) == 1
        assert results[0].get_condition() == "control"
        assert results[0].get_experiment_type() == ExperimentType.SIMPLE

    @respx.mock
    async def test_warm_cache_skips_api(self) -> None:
        route = respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        client = make_client()
        await client.get_all_experiment_conditions()  # warms cache
        await client.get_all_experiment_conditions()  # should hit cache
        assert route.call_count == 1

    @respx.mock
    async def test_ignore_cache_refetches(self) -> None:
        route = respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        client = make_client()
        await client.get_all_experiment_conditions()
        await client.get_all_experiment_conditions(ignore_cache=True)
        assert route.call_count == 2

    @respx.mock
    async def test_returns_assignment_objects(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        from upgrade_client_lib.assignment import Assignment

        results = await make_client().get_all_experiment_conditions()
        assert all(isinstance(a, Assignment) for a in results)

    @respx.mock
    async def test_empty_response(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=[]))
        results = await make_client().get_all_experiment_conditions()
        assert results == []

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        results = make_client().get_all_experiment_conditions_sync()
        assert len(results) == 1


# ---------------------------------------------------------------------------
# get_decision_point_assignment
# ---------------------------------------------------------------------------


class TestGetDecisionPointAssignment:
    @respx.mock
    async def test_returns_assignment_when_found(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        result = await make_client().get_decision_point_assignment("home", "banner")
        assert result is not None
        assert result.get_condition() == "control"

    @respx.mock
    async def test_returns_none_when_not_found(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        result = await make_client().get_decision_point_assignment("unknown", "site")
        assert result is None

    @respx.mock
    async def test_auto_fetches_when_cold(self) -> None:
        route = respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        client = make_client()
        assert client._data_service.get_all_assignments() is None
        await client.get_decision_point_assignment("home", "banner")
        assert route.call_count == 1

    @respx.mock
    async def test_uses_cache_on_second_call(self) -> None:
        route = respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        client = make_client()
        await client.get_decision_point_assignment("home", "banner")
        await client.get_decision_point_assignment("home", "banner")
        assert route.call_count == 1

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        result = make_client().get_decision_point_assignment_sync("home", "banner")
        assert result is not None


# ---------------------------------------------------------------------------
# mark_decision_point
# ---------------------------------------------------------------------------


class TestMarkDecisionPoint:
    @respx.mock
    async def test_marks_with_warm_cache(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        route = respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        client = make_client()
        await client.get_all_experiment_conditions()
        result = await client.mark_decision_point(
             "control", MarkedDecisionPointStatus.CONDITION_APPLIED,"home", "banner",
        )
        assert result.site == "home"
        assert route.call_count == 1

    @respx.mock
    async def test_auto_fetches_assignments_when_cold(self) -> None:
        assign_route = respx.post(f"{BASE}/assign").mock(
            return_value=Response(200, json=ASSIGNMENT_PAYLOAD)
        )
        respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        client = make_client()
        assert client._data_service.get_all_assignments() is None
        await client.mark_decision_point(
            "control", MarkedDecisionPointStatus.CONDITION_APPLIED,"home", "banner"
        )
        assert assign_route.call_count == 1

    @respx.mock
    async def test_mark_body_contains_experiment_metadata(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        mark_route = respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        client = make_client()
        await client.get_all_experiment_conditions()
        await client.mark_decision_point(
            "control", MarkedDecisionPointStatus.CONDITION_APPLIED,"home", "banner",
            uniquifier="u-1",
        )
        body = json.loads(mark_route.calls[0].request.content)
        assert body["data"]["site"] == "home"
        assert body["data"]["target"] == "banner"
        assert body["data"]["assignedCondition"]["conditionCode"] == "control"
        assert body["data"]["assignedCondition"]["experimentId"] == "exp-1"
        assert body["uniquifier"] == "u-1"

    @respx.mock
    async def test_rotation_advances_condition_on_successive_marks(self) -> None:
        """Second mark on a multi-condition assignment should use condition[1]."""
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=FACTORIAL_PAYLOAD))
        mark_route = respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        client = make_client()
        await client.get_all_experiment_conditions()

        await client.mark_decision_point(
            "combo-A", MarkedDecisionPointStatus.CONDITION_APPLIED,"quiz", "hint", 
        )
        first_body = json.loads(mark_route.calls[0].request.content)

        await client.mark_decision_point(
            "combo-B", MarkedDecisionPointStatus.CONDITION_APPLIED,"quiz", "hint"
        )
        second_body = json.loads(mark_route.calls[1].request.content)

        # After first mark, rotation advances so the second call sees cond-B's metadata
        assert first_body["data"]["assignedCondition"]["id"] == "cond-A"
        assert second_body["data"]["assignedCondition"]["id"] == "cond-B"

    @respx.mock
    async def test_mark_unknown_decision_point_omits_metadata(self) -> None:
        """Marking an unknown site/target omits experiment metadata gracefully."""
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        mark_route = respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        client = make_client()
        await client.get_all_experiment_conditions()
        await client.mark_decision_point(
             "default", MarkedDecisionPointStatus.NO_CONDITION_ASSIGNED,"unknown", "site"
        )
        body = json.loads(mark_route.calls[0].request.content)
        assert body["data"]["site"] == "unknown"
        assert "experimentType" not in body["data"]

    @respx.mock
    async def test_null_target_in_assignment_payload(self) -> None:
        """An assignment with target=null should produce a mark request with target=null."""
        null_target_payload = [
            {
                "site": "home",
                "target": None,
                "experimentType": "Simple",
                "assignedCondition": [
                    {"id": "cond-1", "conditionCode": "control", "payload": None, "experimentId": "exp-1"}
                ],
                "assignedFactor": None,
            }
        ]
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=null_target_payload))
        mark_route = respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        client = make_client()
        await client.get_all_experiment_conditions()
        await client.mark_decision_point(
             "control", MarkedDecisionPointStatus.CONDITION_APPLIED,"home"
        )
        body = json.loads(mark_route.calls[0].request.content)
        assert body["data"]["target"] == ''

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        result = make_client().mark_decision_point_sync(
            "control", MarkedDecisionPointStatus.CONDITION_APPLIED,"home", "banner"
        )
        assert result.userId == USER


# ---------------------------------------------------------------------------
# get_all_feature_flags
# ---------------------------------------------------------------------------


class TestGetAllFeatureFlags:
    @respx.mock
    async def test_cold_cache_fetches_api(self) -> None:
        route = respx.post(f"{BASE}/featureflag").mock(
            return_value=Response(200, json=["dark-mode", "new-ui"])
        )
        client = make_client()
        results = await client.get_all_feature_flags()
        assert route.call_count == 1
        assert {f.key for f in results} == {"dark-mode", "new-ui"}

    @respx.mock
    async def test_warm_cache_skips_api(self) -> None:
        route = respx.post(f"{BASE}/featureflag").mock(
            return_value=Response(200, json=["dark-mode"])
        )
        client = make_client()
        await client.get_all_feature_flags()
        await client.get_all_feature_flags()
        assert route.call_count == 1

    @respx.mock
    async def test_ignore_cache_refetches(self) -> None:
        route = respx.post(f"{BASE}/featureflag").mock(
            return_value=Response(200, json=["dark-mode"])
        )
        client = make_client()
        await client.get_all_feature_flags()
        await client.get_all_feature_flags(ignore_cache=True)
        assert route.call_count == 2

    @respx.mock
    async def test_returns_feature_flag_objects(self) -> None:
        respx.post(f"{BASE}/featureflag").mock(return_value=Response(200, json=["dark-mode"]))
        from upgrade_client_lib.types.responses import FeatureFlag

        results = await make_client().get_all_feature_flags()
        assert all(isinstance(f, FeatureFlag) for f in results)
        assert results[0].key == "dark-mode"

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/featureflag").mock(return_value=Response(200, json=["dark-mode"]))
        results = make_client().get_all_feature_flags_sync()
        assert results[0].key == "dark-mode"


# ---------------------------------------------------------------------------
# has_feature_flag
# ---------------------------------------------------------------------------


class TestHasFeatureFlag:
    @respx.mock
    async def test_true_when_present(self) -> None:
        respx.post(f"{BASE}/featureflag").mock(
            return_value=Response(200, json=["dark-mode", "new-ui"])
        )
        assert await make_client().has_feature_flag("dark-mode") is True

    @respx.mock
    async def test_false_when_absent(self) -> None:
        respx.post(f"{BASE}/featureflag").mock(
            return_value=Response(200, json=["dark-mode"])
        )
        assert await make_client().has_feature_flag("other") is False

    @respx.mock
    async def test_auto_fetches_when_cold(self) -> None:
        route = respx.post(f"{BASE}/featureflag").mock(
            return_value=Response(200, json=["dark-mode"])
        )
        client = make_client()
        assert client._data_service.get_feature_flags() is None
        await client.has_feature_flag("dark-mode")
        assert route.call_count == 1

    @respx.mock
    async def test_warm_cache_skips_fetch(self) -> None:
        route = respx.post(f"{BASE}/featureflag").mock(
            return_value=Response(200, json=["dark-mode"])
        )
        client = make_client()
        await client.get_all_feature_flags()
        await client.has_feature_flag("dark-mode")
        assert route.call_count == 1  # only the initial fetch

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/featureflag").mock(return_value=Response(200, json=["dark-mode"]))
        assert make_client().has_feature_flag_sync("dark-mode") is True


# ---------------------------------------------------------------------------
# log
# ---------------------------------------------------------------------------


class TestLog:
    @respx.mock
    async def test_async(self) -> None:
        respx.post(f"{BASE}/log").mock(return_value=Response(200, json=LOG_PAYLOAD))
        results = await make_client().log(
            [LogInput(timestamp="2024-01-01T00:00:00Z", metrics=LogMetrics())]
        )
        assert results[0].id == 1

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/log").mock(return_value=Response(200, json=LOG_PAYLOAD))
        results = make_client().log_sync(
            [LogInput(timestamp="2024-01-01T00:00:00Z", metrics=LogMetrics())]
        )
        assert results[0].id == 1


# ---------------------------------------------------------------------------
# set_alt_user_ids
# ---------------------------------------------------------------------------


class TestSetAltUserIds:
    @respx.mock
    async def test_async(self) -> None:
        respx.patch(f"{BASE}/useraliases").mock(return_value=Response(200, json=ALIAS_PAYLOAD))
        result = await make_client().set_alt_user_ids(["alias-1"])
        assert result.aliases == ["alias-1"]

    @respx.mock
    def test_sync(self) -> None:
        respx.patch(f"{BASE}/useraliases").mock(return_value=Response(200, json=ALIAS_PAYLOAD))
        result = make_client().set_alt_user_ids_sync(["alias-1"])
        assert result.userId == USER


# ---------------------------------------------------------------------------
# send_reward
# ---------------------------------------------------------------------------


class TestSendReward:
    @respx.mock
    async def test_async_success(self) -> None:
        respx.post(f"{BASE}/reward").mock(return_value=Response(200, json=REWARD_PAYLOAD))
        result = await make_client().send_reward(BinaryRewardValue.SUCCESS)
        assert result.message == "ok"
        assert result.reward.variable == "score"

    @respx.mock
    async def test_passes_all_params(self) -> None:
        route = respx.post(f"{BASE}/reward").mock(return_value=Response(200, json=REWARD_PAYLOAD))
        await make_client().send_reward(
            BinaryRewardValue.FAILURE,
            experiment_id="exp-1",
            context="ctx",
            decision_point={"site": "home", "target": "banner"},
        )
        body = json.loads(route.calls[0].request.content)
        assert body["rewardValue"] == "FAILURE"
        assert body["experimentId"] == "exp-1"
        assert body["context"] == "ctx"
        assert body["decisionPoint"] == {"site": "home", "target": "banner"}

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/reward").mock(return_value=Response(200, json=REWARD_PAYLOAD))
        result = make_client().send_reward_sync(BinaryRewardValue.SUCCESS)
        assert result.reward.mooclet == 1
