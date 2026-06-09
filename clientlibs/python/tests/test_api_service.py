"""Tests for ApiService — all endpoints covered with respx mocks."""

import pytest
import respx
from httpx import Request, Response

from upgrade_client_lib.api_service import ApiService
from upgrade_client_lib.exceptions import UpgradeApiError
from upgrade_client_lib.types.enums import BinaryRewardValue, ExperimentType, MarkedDecisionPointStatus
from upgrade_client_lib.types.requests import LogInput, LogMetrics

HOST = "https://upgrade.example.com"
USER_ID = "user-abc"
CONTEXT = "test-app"
TOKEN = "secret-token"
SESSION_ID = "session-xyz"

BASE = f"{HOST}/api/v6"


def make_service(**kwargs: object) -> ApiService:
    return ApiService(
        host_url=HOST,
        user_id=USER_ID,
        context=CONTEXT,
        token=TOKEN,
        client_session_id=SESSION_ID,
        **kwargs,  # type: ignore[arg-type]
    )


def assert_common_headers(request: Request) -> None:
    assert request.headers["content-type"] == "application/json"
    assert request.headers["user-id"] == USER_ID
    assert request.headers["session-id"] == SESSION_ID
    assert request.headers["authorization"] == f"Bearer {TOKEN}"


# ---------------------------------------------------------------------------
# init_user
# ---------------------------------------------------------------------------


class TestInitUser:
    PAYLOAD = {"id": USER_ID, "group": None, "workingGroup": None}

    @respx.mock
    async def test_async_minimal(self) -> None:
        route = respx.post(f"{BASE}/init").mock(return_value=Response(200, json=self.PAYLOAD))
        svc = make_service()
        result = await svc.init_user()
        assert result.id == USER_ID
        assert route.called

    @respx.mock
    async def test_async_with_group_and_working_group(self) -> None:
        group = {"classId": ["cls-1"]}
        wg = {"classId": "cls-1"}
        route = respx.post(f"{BASE}/init").mock(return_value=Response(200, json=self.PAYLOAD))
        svc = make_service()
        await svc.init_user(group=group, working_group=wg)
        sent = route.calls[0].request
        import json

        body = json.loads(sent.content)
        assert body["group"] == group
        assert body["workingGroup"] == wg

    @respx.mock
    async def test_async_headers(self) -> None:
        route = respx.post(f"{BASE}/init").mock(return_value=Response(200, json=self.PAYLOAD))
        await make_service().init_user()
        assert_common_headers(route.calls[0].request)

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/init").mock(return_value=Response(200, json=self.PAYLOAD))
        result = make_service().init_user_sync()
        assert result.id == USER_ID

    @respx.mock
    def test_sync_with_group_and_working_group(self) -> None:
        route = respx.post(f"{BASE}/init").mock(return_value=Response(200, json=self.PAYLOAD))
        make_service().init_user_sync(group={"cls": ["a"]}, working_group={"cls": "a"})
        import json

        body = json.loads(route.calls[0].request.content)
        assert body["group"] == {"cls": ["a"]}
        assert body["workingGroup"] == {"cls": "a"}

    @respx.mock
    async def test_async_error(self) -> None:
        respx.post(f"{BASE}/init").mock(return_value=Response(500, text="Server Error"))
        with pytest.raises(UpgradeApiError) as exc_info:
            await make_service().init_user()
        assert exc_info.value.status_code == 500

    @respx.mock
    def test_no_token_omits_auth_header(self) -> None:
        respx.post(f"{BASE}/init").mock(return_value=Response(200, json=self.PAYLOAD))
        svc = ApiService(host_url=HOST, user_id=USER_ID, context=CONTEXT)
        svc.init_user_sync()
        req = respx.calls[0].request
        assert "authorization" not in req.headers


# ---------------------------------------------------------------------------
# set_group_membership
# ---------------------------------------------------------------------------


class TestSetGroupMembership:
    PAYLOAD = {"id": USER_ID, "group": {"classId": ["cls-1"]}, "workingGroup": None}

    @respx.mock
    async def test_async(self) -> None:
        respx.patch(f"{BASE}/groupmembership").mock(return_value=Response(200, json=self.PAYLOAD))
        result = await make_service().set_group_membership({"classId": ["cls-1"]})
        assert result.group == {"classId": ["cls-1"]}

    @respx.mock
    def test_sync(self) -> None:
        respx.patch(f"{BASE}/groupmembership").mock(return_value=Response(200, json=self.PAYLOAD))
        result = make_service().set_group_membership_sync({"classId": ["cls-1"]})
        assert result.group == {"classId": ["cls-1"]}

    @respx.mock
    async def test_error(self) -> None:
        respx.patch(f"{BASE}/groupmembership").mock(return_value=Response(404, text="Not found"))
        with pytest.raises(UpgradeApiError) as exc_info:
            await make_service().set_group_membership({"classId": ["cls-1"]})
        assert exc_info.value.status_code == 404
        assert "Not found" in exc_info.value.response_body


# ---------------------------------------------------------------------------
# set_working_group
# ---------------------------------------------------------------------------


class TestSetWorkingGroup:
    PAYLOAD = {"id": USER_ID, "group": None, "workingGroup": {"classId": "cls-1"}}

    @respx.mock
    async def test_async(self) -> None:
        respx.patch(f"{BASE}/workinggroup").mock(return_value=Response(200, json=self.PAYLOAD))
        result = await make_service().set_working_group({"classId": "cls-1"})
        assert result.workingGroup == {"classId": "cls-1"}

    @respx.mock
    def test_sync(self) -> None:
        respx.patch(f"{BASE}/workinggroup").mock(return_value=Response(200, json=self.PAYLOAD))
        result = make_service().set_working_group_sync({"classId": "cls-1"})
        assert result.workingGroup == {"classId": "cls-1"}


# ---------------------------------------------------------------------------
# get_all_experiment_conditions
# ---------------------------------------------------------------------------

ASSIGNMENT_PAYLOAD = [
    {
        "site": "home",
        "target": "banner",
        "experimentType": "Simple",
        "assignedCondition": [{"id": "cond-1", "conditionCode": "control", "payload": None, "experimentId": "exp-1"}],
        "assignedFactor": None,
    }
]


class TestGetAllExperimentConditions:
    @respx.mock
    async def test_async(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        results = await make_service().get_all_experiment_conditions()
        assert len(results) == 1
        assert results[0].site == "home"
        assert results[0].experimentType == ExperimentType.SIMPLE
        assert results[0].assignedCondition[0].conditionCode == "control"

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=ASSIGNMENT_PAYLOAD))
        results = make_service().get_all_experiment_conditions_sync()
        assert results[0].target == "banner"

    @respx.mock
    async def test_sends_context(self) -> None:
        route = respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=[]))
        await make_service().get_all_experiment_conditions()
        import json

        body = json.loads(route.calls[0].request.content)
        assert body["context"] == CONTEXT
        assert body["userId"] == USER_ID

    @respx.mock
    async def test_empty_response(self) -> None:
        respx.post(f"{BASE}/assign").mock(return_value=Response(200, json=[]))
        results = await make_service().get_all_experiment_conditions()
        assert results == []


# ---------------------------------------------------------------------------
# mark_decision_point
# ---------------------------------------------------------------------------

MARK_PAYLOAD = {
    "id": "mark-1",
    "userId": USER_ID,
    "site": "home",
    "target": "banner",
    "experimentId": "exp-1",
    "condition": "control",
}


class TestMarkDecisionPoint:
    @respx.mock
    async def test_async_minimal(self) -> None:
        respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        result = await make_service().mark_decision_point(
            site="home",
            target="banner",
            condition_code="control",
            status=MarkedDecisionPointStatus.CONDITION_APPLIED,
        )
        assert result.site == "home"
        assert result.condition == "control"

    @respx.mock
    async def test_async_full(self) -> None:
        route = respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        await make_service().mark_decision_point(
            site="home",
            target="banner",
            condition_code="control",
            status=MarkedDecisionPointStatus.CONDITION_APPLIED,
            experiment_type=ExperimentType.SIMPLE,
            experiment_id="exp-1",
            condition_id="cond-1",
            uniquifier="uniq-abc",
            client_error="",
        )
        import json

        body = json.loads(route.calls[0].request.content)
        assert body["status"] == "condition applied"
        assert body["data"]["site"] == "home"
        assert body["data"]["experimentType"] == "Simple"
        assert body["data"]["assignedCondition"]["conditionCode"] == "control"
        assert body["data"]["assignedCondition"]["experimentId"] == "exp-1"
        assert body["data"]["assignedCondition"]["id"] == "cond-1"
        assert body["uniquifier"] == "uniq-abc"

    @respx.mock
    async def test_with_assigned_factor(self) -> None:
        route = respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        factor = {"color": {"level": "red", "payload": None}}
        await make_service().mark_decision_point(
            site="home",
            target="banner",
            condition_code="control",
            status=MarkedDecisionPointStatus.CONDITION_APPLIED,
            assigned_factor=factor,
        )
        import json

        body = json.loads(route.calls[0].request.content)
        assert body["data"]["assignedFactor"] == factor

    @respx.mock
    async def test_optional_fields_omitted_when_none(self) -> None:
        route = respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        await make_service().mark_decision_point(
            site="home",
            target="banner",
            condition_code="control",
            status=MarkedDecisionPointStatus.NO_CONDITION_ASSIGNED,
        )
        import json

        body = json.loads(route.calls[0].request.content)
        assert "uniquifier" not in body
        assert "clientError" not in body
        assert "experimentType" not in body["data"]

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/mark").mock(return_value=Response(200, json=MARK_PAYLOAD))
        result = make_service().mark_decision_point_sync(
            site="home",
            target="banner",
            condition_code="control",
            status=MarkedDecisionPointStatus.CONDITION_APPLIED,
        )
        assert result.userId == USER_ID


# ---------------------------------------------------------------------------
# get_all_feature_flags
# ---------------------------------------------------------------------------


class TestGetAllFeatureFlags:
    @respx.mock
    async def test_async(self) -> None:
        respx.post(f"{BASE}/featureflag").mock(return_value=Response(200, json=["dark-mode", "new-ui"]))
        result = await make_service().get_all_feature_flags()
        assert result == ["dark-mode", "new-ui"]

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/featureflag").mock(return_value=Response(200, json=["dark-mode"]))
        result = make_service().get_all_feature_flags_sync()
        assert result == ["dark-mode"]

    @respx.mock
    async def test_sends_context(self) -> None:
        route = respx.post(f"{BASE}/featureflag").mock(return_value=Response(200, json=[]))
        await make_service().get_all_feature_flags()
        import json

        body = json.loads(route.calls[0].request.content)
        assert body["context"] == CONTEXT

    @respx.mock
    async def test_empty(self) -> None:
        respx.post(f"{BASE}/featureflag").mock(return_value=Response(200, json=[]))
        assert await make_service().get_all_feature_flags() == []


# ---------------------------------------------------------------------------
# log
# ---------------------------------------------------------------------------

LOG_RESPONSE = [{"id": 1, "uniquifier": "u1", "timeStamp": "2024-01-01T00:00:00Z", "data": {"score": 95}}]


class TestLog:
    def _make_log_input(self) -> LogInput:
        return LogInput(timestamp="2024-01-01T00:00:00Z", metrics=LogMetrics(attributes={"score": 95}))

    @respx.mock
    async def test_async(self) -> None:
        respx.post(f"{BASE}/log").mock(return_value=Response(200, json=LOG_RESPONSE))
        results = await make_service().log([self._make_log_input()])
        assert results[0].id == 1
        assert results[0].data == {"score": 95}

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/log").mock(return_value=Response(200, json=LOG_RESPONSE))
        results = make_service().log_sync([self._make_log_input()])
        assert results[0].uniquifier == "u1"

    @respx.mock
    async def test_sends_user_id(self) -> None:
        route = respx.post(f"{BASE}/log").mock(return_value=Response(200, json=[]))
        await make_service().log([self._make_log_input()])
        import json

        body = json.loads(route.calls[0].request.content)
        assert body["userId"] == USER_ID
        assert len(body["value"]) == 1


# ---------------------------------------------------------------------------
# set_alt_user_ids
# ---------------------------------------------------------------------------

ALIAS_RESPONSE = {"userId": USER_ID, "aliases": ["alias-1", "alias-2"]}


class TestSetAltUserIds:
    @respx.mock
    async def test_async(self) -> None:
        respx.patch(f"{BASE}/useraliases").mock(return_value=Response(200, json=ALIAS_RESPONSE))
        result = await make_service().set_alt_user_ids(["alias-1", "alias-2"])
        assert result.aliases == ["alias-1", "alias-2"]

    @respx.mock
    def test_sync(self) -> None:
        respx.patch(f"{BASE}/useraliases").mock(return_value=Response(200, json=ALIAS_RESPONSE))
        result = make_service().set_alt_user_ids_sync(["alias-1", "alias-2"])
        assert result.userId == USER_ID

    @respx.mock
    async def test_sends_aliases(self) -> None:
        route = respx.patch(f"{BASE}/useraliases").mock(return_value=Response(200, json=ALIAS_RESPONSE))
        await make_service().set_alt_user_ids(["alias-1"])
        import json

        body = json.loads(route.calls[0].request.content)
        assert body["aliases"] == ["alias-1"]
        assert body["userId"] == USER_ID


# ---------------------------------------------------------------------------
# send_reward
# ---------------------------------------------------------------------------

REWARD_RESPONSE = {
    "message": "Reward sent",
    "request": {"rewardValue": "SUCCESS", "experimentId": "exp-1"},
    "reward": {"variable": "score", "value": 1.0, "mooclet": 42, "version": 3, "learner": USER_ID},
}


class TestSendReward:
    @respx.mock
    async def test_async_minimal(self) -> None:
        respx.post(f"{BASE}/reward").mock(return_value=Response(200, json=REWARD_RESPONSE))
        result = await make_service().send_reward(BinaryRewardValue.SUCCESS)
        assert result.message == "Reward sent"
        assert result.reward.variable == "score"

    @respx.mock
    def test_sync(self) -> None:
        respx.post(f"{BASE}/reward").mock(return_value=Response(200, json=REWARD_RESPONSE))
        result = make_service().send_reward_sync(BinaryRewardValue.SUCCESS)
        assert result.reward.mooclet == 42

    @respx.mock
    async def test_full_params(self) -> None:
        route = respx.post(f"{BASE}/reward").mock(return_value=Response(200, json=REWARD_RESPONSE))
        await make_service().send_reward(
            reward_value=BinaryRewardValue.FAILURE,
            experiment_id="exp-1",
            context="my-app",
            decision_point={"site": "home", "target": "banner"},
        )
        import json

        body = json.loads(route.calls[0].request.content)
        assert body["rewardValue"] == "FAILURE"
        assert body["experimentId"] == "exp-1"
        assert body["context"] == "my-app"
        assert body["decisionPoint"] == {"site": "home", "target": "banner"}

    @respx.mock
    async def test_optional_fields_omitted_when_none(self) -> None:
        route = respx.post(f"{BASE}/reward").mock(return_value=Response(200, json=REWARD_RESPONSE))
        await make_service().send_reward(BinaryRewardValue.SUCCESS)
        import json

        body = json.loads(route.calls[0].request.content)
        assert "experimentId" not in body
        assert "context" not in body
        assert "decisionPoint" not in body

    @respx.mock
    async def test_error_401(self) -> None:
        respx.post(f"{BASE}/reward").mock(return_value=Response(401, text="Unauthorized"))
        with pytest.raises(UpgradeApiError) as exc_info:
            await make_service().send_reward(BinaryRewardValue.SUCCESS)
        assert exc_info.value.status_code == 401
        assert "Unauthorized" in exc_info.value.response_body


# ---------------------------------------------------------------------------
# UpgradeApiError attributes
# ---------------------------------------------------------------------------


class TestUpgradeApiError:
    @respx.mock
    async def test_error_carries_body(self) -> None:
        respx.post(f"{BASE}/init").mock(return_value=Response(503, text='{"message":"unavailable"}'))
        with pytest.raises(UpgradeApiError) as exc_info:
            await make_service().init_user()
        err = exc_info.value
        assert err.status_code == 503
        assert '{"message":"unavailable"}' in err.response_body

    def test_repr(self) -> None:
        err = UpgradeApiError(404, "not found")
        assert "404" in repr(err)
        assert "not found" in repr(err)
