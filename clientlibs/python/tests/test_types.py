"""Tests for enums, request models, and response models (Phase 2)."""

import pytest
from pydantic import ValidationError

from upgrade_client_lib.types import (
    AssignedCondition,
    AssignedFactor,
    AssignRequest,
    BinaryRewardValue,
    DecisionPointRef,
    ErrorResponse,
    ExperimentAssignment,
    ExperimentType,
    FeatureFlag,
    InitializeUserRequest,
    InitializeUserResponse,
    LogEventResponse,
    LogGroupMetrics,
    LogInput,
    LogMetrics,
    LogRequest,
    MarkDecisionPointCondition,
    MarkDecisionPointData,
    MarkDecisionPointRequest,
    MarkDecisionPointResponse,
    MarkedDecisionPointStatus,
    Payload,
    PayloadType,
    SendRewardRequest,
    SetGroupMembershipRequest,
    SetWorkingGroupRequest,
    UserAliasRequest,
    UserAliasResponse,
)

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class TestMarkedDecisionPointStatus:
    def test_values(self) -> None:
        assert MarkedDecisionPointStatus.CONDITION_APPLIED == "condition applied"
        assert MarkedDecisionPointStatus.CONDITION_FAILED_TO_APPLY == "condition not applied"
        assert MarkedDecisionPointStatus.NO_CONDITION_ASSIGNED == "no condition assigned"

    def test_is_string_enum(self) -> None:
        assert isinstance(MarkedDecisionPointStatus.CONDITION_APPLIED, str)


class TestExperimentType:
    def test_values(self) -> None:
        assert ExperimentType.SIMPLE == "Simple"
        assert ExperimentType.FACTORIAL == "Factorial"


class TestPayloadType:
    def test_values(self) -> None:
        assert PayloadType.STRING == "string"
        assert PayloadType.JSON == "json"
        assert PayloadType.CSV == "csv"


class TestBinaryRewardValue:
    def test_values(self) -> None:
        assert BinaryRewardValue.SUCCESS == "SUCCESS"
        assert BinaryRewardValue.FAILURE == "FAILURE"


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class TestInitializeUserRequest:
    def test_all_optional(self) -> None:
        req = InitializeUserRequest()
        assert req.id is None
        assert req.group is None
        assert req.workingGroup is None

    def test_with_values(self) -> None:
        req = InitializeUserRequest(
            id="user-1",
            group={"classId": ["class-A"]},
            workingGroup={"classId": "class-A"},
        )
        assert req.id == "user-1"
        assert req.group == {"classId": ["class-A"]}
        assert req.workingGroup == {"classId": "class-A"}


class TestSetGroupMembershipRequest:
    def test_valid(self) -> None:
        req = SetGroupMembershipRequest(id="user-1", group={"classId": ["a", "b"]})
        assert req.id == "user-1"

    def test_missing_required(self) -> None:
        with pytest.raises(ValidationError):
            SetGroupMembershipRequest(group={"classId": ["a"]})  # type: ignore[call-arg]


class TestSetWorkingGroupRequest:
    def test_valid(self) -> None:
        req = SetWorkingGroupRequest(id="user-1", workingGroup={"classId": "class-A"})
        assert req.workingGroup == {"classId": "class-A"}


class TestAssignRequest:
    def test_valid(self) -> None:
        req = AssignRequest(userId="user-1", context="my-app")
        assert req.userId == "user-1"
        assert req.context == "my-app"

    def test_valid_with_decision_point(self) -> None:
        req = AssignRequest(userId="user-1", context="my-app", decisionPoint={"site": "home", "target": ""})
        assert req.decisionPoint.site == "home"
        assert req.decisionPoint.target == ""


class TestMarkDecisionPointRequest:
    def test_valid_minimal(self) -> None:
        req = MarkDecisionPointRequest(
            status=MarkedDecisionPointStatus.CONDITION_APPLIED,
            data=MarkDecisionPointData(
                site="home",
                target="banner",
                assignedCondition=MarkDecisionPointCondition(conditionCode="control"),
            ),
        )
        assert req.status == MarkedDecisionPointStatus.CONDITION_APPLIED
        assert req.uniquifier is None
        assert req.clientError is None

    def test_valid_full(self) -> None:
        req = MarkDecisionPointRequest(
            status=MarkedDecisionPointStatus.CONDITION_APPLIED,
            data=MarkDecisionPointData(
                site="home",
                target="banner",
                assignedCondition=MarkDecisionPointCondition(conditionCode="treatment", experimentId="exp-123"),
            ),
            uniquifier="abc",
            clientError="",
        )
        assert req.data.assignedCondition.experimentId == "exp-123"
        assert req.uniquifier == "abc"

    def test_invalid_status(self) -> None:
        with pytest.raises(ValidationError):
            MarkDecisionPointRequest(
                status="not-a-status",  # type: ignore[arg-type]
                data=MarkDecisionPointData(
                    site="home",
                    target="banner",
                    assignedCondition=MarkDecisionPointCondition(conditionCode="control"),
                ),
            )


class TestLogRequest:
    def test_valid(self) -> None:
        req = LogRequest(
            userId="user-1",
            value=[
                LogInput(
                    timestamp="2024-01-01T00:00:00Z",
                    metrics=LogMetrics(
                        attributes={"score": 95},
                        groupedMetrics=[
                            LogGroupMetrics(
                                groupClass="quiz",
                                groupKey="q1",
                                groupUniquifier="u1",
                                attributes={"correct": True},
                            )
                        ],
                    ),
                )
            ],
        )
        assert req.userId == "user-1"
        assert req.value[0].metrics.attributes == {"score": 95}
        assert req.value[0].metrics.groupedMetrics[0].groupClass == "quiz"

    def test_empty_metrics(self) -> None:
        log_input = LogInput(
            timestamp="2024-01-01T00:00:00Z",
            metrics=LogMetrics(),
        )
        assert log_input.metrics.attributes == {}
        assert log_input.metrics.groupedMetrics == []


class TestUserAliasRequest:
    def test_valid(self) -> None:
        req = UserAliasRequest(userId="user-1", aliases=["alias-a", "alias-b"])
        assert req.aliases == ["alias-a", "alias-b"]


class TestSendRewardRequest:
    def test_minimal(self) -> None:
        req = SendRewardRequest(rewardValue=BinaryRewardValue.SUCCESS)
        assert req.rewardValue == BinaryRewardValue.SUCCESS
        assert req.experimentId is None
        assert req.decisionPoint is None

    def test_full(self) -> None:
        req = SendRewardRequest(
            rewardValue=BinaryRewardValue.FAILURE,
            experimentId="exp-1",
            context="my-app",
            decisionPoint=DecisionPointRef(site="home", target="banner"),
        )
        assert req.decisionPoint is not None
        assert req.decisionPoint.site == "home"


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class TestInitializeUserResponse:
    def test_valid(self) -> None:
        resp = InitializeUserResponse(id="user-1")
        assert resp.id == "user-1"
        assert resp.group is None

    def test_with_groups(self) -> None:
        resp = InitializeUserResponse(
            id="user-1",
            group={"classId": ["a"]},
            workingGroup={"classId": "a"},
        )
        assert resp.group == {"classId": ["a"]}

    def test_missing_id(self) -> None:
        with pytest.raises(ValidationError):
            InitializeUserResponse()  # type: ignore[call-arg]


class TestPayload:
    def test_string_payload(self) -> None:
        p = Payload(type=PayloadType.STRING, value="hello")
        assert p.type == PayloadType.STRING
        assert p.value == "hello"

    def test_json_payload(self) -> None:
        p = Payload(type=PayloadType.JSON, value='{"key": "val"}')
        assert p.type == PayloadType.JSON


class TestExperimentAssignment:
    def test_simple_experiment(self) -> None:
        assignment = ExperimentAssignment(
            site="home",
            target="banner",
            experimentType=ExperimentType.SIMPLE,
            assignedCondition=[
                AssignedCondition(
                    id="cond-1",
                    conditionCode="control",
                    payload=Payload(type=PayloadType.STRING, value="red"),
                    experimentId="exp-1",
                )
            ],
        )
        assert assignment.experimentType == ExperimentType.SIMPLE
        assert assignment.assignedCondition[0].conditionCode == "control"
        assert assignment.assignedFactor is None

    def test_factorial_experiment(self) -> None:
        assignment = ExperimentAssignment(
            site="home",
            target="banner",
            experimentType=ExperimentType.FACTORIAL,
            assignedCondition=[AssignedCondition(id="cond-1", conditionCode="control")],
            assignedFactor=[
                {
                    "color": AssignedFactor(
                        level="red",
                        payload=Payload(type=PayloadType.STRING, value="red"),
                    )
                }
            ],
        )
        assert assignment.assignedFactor is not None
        assert assignment.assignedFactor[0]["color"].level == "red"


class TestMarkDecisionPointResponse:
    def test_valid(self) -> None:
        resp = MarkDecisionPointResponse(
            userId="user-1",
            site="home",
            target="banner",
        )
        assert resp.userId == "user-1"
        assert resp.experimentId is None

    def test_full(self) -> None:
        resp = MarkDecisionPointResponse(
            id="mark-1",
            userId="user-1",
            site="home",
            target="banner",
            experimentId="exp-1",
            condition="control",
        )
        assert resp.condition == "control"


class TestLogEventResponse:
    def test_valid(self) -> None:
        resp = LogEventResponse(
            id=1,
            uniquifier="u1",
            timeStamp="2024-01-01T00:00:00Z",
            data={"score": 95},
        )
        assert resp.id == 1
        assert resp.data == {"score": 95}


class TestUserAliasResponse:
    def test_valid(self) -> None:
        resp = UserAliasResponse(userId="user-1", aliases=["a1", "a2"])
        assert resp.aliases == ["a1", "a2"]


class TestFeatureFlag:
    def test_key_only(self) -> None:
        flag = FeatureFlag(key="dark-mode")
        assert flag.key == "dark-mode"
        assert flag.status is None

    def test_with_status(self) -> None:
        flag = FeatureFlag(key="dark-mode", status=True, variationValue="enabled")
        assert flag.status is True
        assert flag.variationValue == "enabled"


class TestErrorResponse:
    def test_minimal(self) -> None:
        err = ErrorResponse(message="Not found")
        assert err.message == "Not found"
        assert err.httpStatusCode is None

    def test_full(self) -> None:
        err = ErrorResponse(message="Server error", httpStatusCode=500, type="InternalServerError")
        assert err.httpStatusCode == 500
